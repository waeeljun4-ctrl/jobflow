<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StageStatus;
use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\StageInstance;
use App\Models\User;
use App\Models\WorkerHourArchive;
use App\Services\PdfBrandingService;
use App\Services\WorkHoursReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WorkerHoursController extends Controller
{
    private const DAY_NAMES_AR = [
        0 => 'الأحد', 1 => 'الاثنين', 2 => 'الثلاثاء', 3 => 'الأربعاء',
        4 => 'الخميس', 5 => 'الجمعة', 6 => 'السبت',
    ];

    private const MONTH_NAMES_AR = [
        1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل', 5 => 'مايو', 6 => 'يونيو',
        7 => 'يوليو', 8 => 'أغسطس', 9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
    ];

    public function __construct(private WorkHoursReportService $report, private PdfBrandingService $branding)
    {
    }

    /**
     * Total worked hours per worker, across every stage instance they've
     * ever touched — built on the same pause-aware elapsed_hours used
     * everywhere else, so a stage left open overnight or over a material
     * shortage never inflates a worker's count.
     */
    public function index()
    {
        $workers = User::where('role', 'worker')->orderBy('name')->get();

        $stats = $workers->map(function (User $worker) {
            $instances = StageInstance::where('assigned_to', $worker->id)
                ->whereNotNull('started_at')
                ->with('pauses')
                ->get();

            return [
                'id' => $worker->id,
                'name' => $worker->name,
                'total_hours' => round($instances->sum('elapsed_hours'), 1),
                'tasks_count' => $instances->count(),
                'active_count' => $instances->where('status', StageStatus::InProgress->value)->count(),
            ];
        })->sortByDesc('total_hours')->values();

        return Inertia::render('Admin/WorkerHours', [
            'workers' => $stats,
        ]);
    }

    /**
     * The daily/monthly log for one worker — date by date, which orders
     * contributed hours that day, rolled up into monthly totals.
     */
    public function show(User $user)
    {
        return Inertia::render('Admin/WorkerHoursDetail', [
            'worker' => $user->only('id', 'name'),
            ...$this->buildReport($user),
            'tasks' => $this->buildTaskList($user),
        ]);
    }

    /**
     * Raw per-task list (not the day/order rollup used by the report above)
     * — this is what lets the admin find and correct one specific task,
     * e.g. one a worker forgot to close and that's been silently racking
     * up hours ever since.
     */
    private function buildTaskList(User $worker): array
    {
        return StageInstance::where('assigned_to', $worker->id)
            ->whereNotNull('started_at')
            ->with(['order:id,order_number,customer_name', 'stageDefinition:id,name_ar'])
            ->orderByDesc('started_at')
            ->get()
            ->filter(fn (StageInstance $i) => $i->order)
            ->map(fn (StageInstance $i) => [
                'id' => $i->id,
                'order_number' => $i->order->order_number,
                'customer_name' => $i->order->customer_name,
                'stage_name' => $i->stageDefinition?->name_ar,
                'started_at' => $i->started_at->format('Y-m-d H:i'),
                'completed_at' => $i->completed_at?->format('Y-m-d H:i'),
                'is_running' => $i->completed_at === null,
                'elapsed_hours' => $i->elapsed_hours,
                'manual_hours' => $i->manual_hours,
            ])
            ->values()
            ->all();
    }

    public function updateHours(Request $request, StageInstance $stageInstance)
    {
        $data = $request->validate([
            'manual_hours' => 'nullable|numeric|min:0|max:999',
        ]);

        $stageInstance->update(['manual_hours' => $data['manual_hours']]);

        return back()->with('success', $data['manual_hours'] === null ? 'تم إرجاع الحساب التلقائي' : 'تم تعديل الساعات');
    }

    /**
     * Full reset for one worker: snapshots their current total into
     * worker_hour_archives (so the history isn't just lost), then zeroes
     * every one of their tasks by setting manual_hours = 0 on each —
     * same override mechanism as the single-task edit, just applied in bulk.
     */
    public function resetAll(Request $request, User $user)
    {
        $instances = StageInstance::where('assigned_to', $user->id)
            ->whereNotNull('started_at')
            ->with('pauses')
            ->get();

        $totalHours = round($instances->sum('elapsed_hours'), 2);

        if ($totalHours > 0) {
            WorkerHourArchive::create([
                'user_id' => $user->id,
                'total_hours' => $totalHours,
                'archived_by' => $request->user()->id,
                'archived_at' => now(),
            ]);
        }

        StageInstance::where('assigned_to', $user->id)
            ->whereNotNull('started_at')
            ->update(['manual_hours' => 0]);

        return back()->with('success', "تم تصفير ساعات {$user->name} — {$totalHours} ساعة انحفظت بالأرشيف");
    }

    /**
     * Records left behind by resetAll() above — a worker's hours history
     * before each full reset, so zeroing the counter never means losing
     * the record of what was worked.
     */
    public function archiveIndex()
    {
        return Inertia::render('Admin/WorkerHoursArchive', [
            'archives' => WorkerHourArchive::with(['worker:id,name', 'archivedByUser:id,name'])
                ->orderByDesc('archived_at')
                ->get()
                ->map(fn (WorkerHourArchive $a) => [
                    'id' => $a->id,
                    'worker_name' => $a->worker?->name,
                    'total_hours' => $a->total_hours,
                    'archived_by' => $a->archivedByUser?->name,
                    'archived_at' => $a->archived_at->format('Y-m-d H:i'),
                ]),
        ]);
    }

    public function destroyArchive(WorkerHourArchive $workerHourArchive)
    {
        $workerHourArchive->delete();

        return back()->with('success', 'تم حذف السجل من الأرشيف');
    }

    public function print(User $user)
    {
        $company = CompanySetting::current();
        $logoPath = $company->logo_path && Storage::disk('public')->exists($company->logo_path)
            ? Storage::disk('public')->path($company->logo_path)
            : null;

        [$accentColor, $accentLight] = $this->branding->extractAccentColor($logoPath);
        [$logoWidth, $logoHeight] = $this->branding->fitLogoBox($logoPath);

        $html = view('worker-hours-print', [
            'worker' => $user,
            'company' => $company,
            'logoPath' => $logoPath,
            'logoWidth' => $logoWidth,
            'logoHeight' => $logoHeight,
            'accentColor' => $accentColor,
            'accentLight' => $accentLight,
            ...$this->buildReport($user),
        ])->render();

        $mpdf = $this->branding->makePdf();
        $mpdf->SetTitle("سجل ساعات عمل {$user->name}");
        $this->branding->applyWatermark($mpdf, $logoPath);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "inline; filename=\"worker-hours-{$user->id}.pdf\"");
    }

    /**
     * @return array{daily: array, monthly: array}
     */
    private function buildReport(User $worker): array
    {
        $dailyLog = $this->report->dailyLogForWorker($worker);
        $monthlyTotals = $this->report->monthlyTotals($dailyLog);

        $daily = collect($dailyLog)->map(function ($day, $date) {
            $carbonDate = \Carbon\Carbon::parse($date);

            return [
                'date' => $date,
                'date_label' => $carbonDate->format('Y/m/d'),
                'day_name' => self::DAY_NAMES_AR[$carbonDate->dayOfWeek],
                'total_hours' => round($day['total_minutes'] / 60, 1),
                'orders' => collect($day['orders'])->map(fn ($o) => [
                    'order_number' => $o['order_number'],
                    'customer_name' => $o['customer_name'],
                    'hours' => round($o['minutes'] / 60, 1),
                ])->values(),
            ];
        })->sortByDesc('date')->values();

        $monthly = collect($monthlyTotals)->map(function ($minutes, $month) {
            [$year, $monthNum] = explode('-', $month);

            return [
                'month' => $month,
                'label' => self::MONTH_NAMES_AR[(int) $monthNum].' '.$year,
                'total_hours' => round($minutes / 60, 1),
            ];
        })->sortByDesc('month')->values();

        return ['daily' => $daily, 'monthly' => $monthly];
    }
}
