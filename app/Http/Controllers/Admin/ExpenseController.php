<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\Expense;
use App\Services\PdfBrandingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    private const CATEGORIES = ['مواد خام', 'نقل ومواصلات', 'صيانة', 'فواتير', 'أخرى'];

    public function __construct(private PdfBrandingService $branding)
    {
    }

    private function filteredQuery(Request $request)
    {
        $query = Expense::with('creator:id,name')->orderByDesc('spent_on')->orderByDesc('id');

        if ($from = $request->input('from')) {
            $query->where('spent_on', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('spent_on', '<=', $to);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $expenses = $this->filteredQuery($request)->get();

        // Per-admin breakdown for the same filtered period — several admins
        // can be logging expenses, each needs to see who spent what.
        $byAdmin = $expenses->groupBy('created_by')->map(fn ($group) => [
            'name' => $group->first()->creator?->name ?? '—',
            'total' => $group->sum('amount'),
        ])->sortByDesc('total')->values();

        return Inertia::render('Admin/Expenses', [
            'expenses' => $expenses,
            'byAdmin' => $byAdmin,
            'filters' => $request->only('from', 'to'),
            'categories' => self::CATEGORIES,
            'todayTotal' => Expense::whereDate('spent_on', today())->sum('amount'),
            'weekTotal' => Expense::whereBetween('spent_on', [now()->startOfWeek(), now()->endOfWeek()])->sum('amount'),
            'monthTotal' => Expense::whereYear('spent_on', now()->year)->whereMonth('spent_on', now()->month)->sum('amount'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
            'spent_on' => 'nullable|date',
        ]);

        Expense::create([
            'amount' => $data['amount'],
            'description' => $data['description'],
            'category' => $data['category'] ?? null,
            'spent_on' => $data['spent_on'] ?? now()->toDateString(),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'تم تسجيل المصروف.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return back()->with('success', 'تم حذف المصروف.');
    }

    public function print(Request $request)
    {
        $expenses = $this->filteredQuery($request)->get();
        $filters = ['from' => $request->string('from')->toString(), 'to' => $request->string('to')->toString()];

        $company = CompanySetting::current();
        $logoPath = $company->logo_path && Storage::disk('public')->exists($company->logo_path)
            ? Storage::disk('public')->path($company->logo_path)
            : null;

        [$accentColor, $accentLight] = $this->branding->extractAccentColor($logoPath);
        [$logoWidth, $logoHeight] = $this->branding->fitLogoBox($logoPath);

        $html = view('expenses-print', [
            'expenses' => $expenses,
            'company' => $company,
            'logoPath' => $logoPath,
            'accentColor' => $accentColor,
            'accentLight' => $accentLight,
            'logoWidth' => $logoWidth,
            'logoHeight' => $logoHeight,
            'filters' => $filters,
            'total' => $expenses->sum('amount'),
        ])->render();

        $mpdf = $this->branding->makePdf();
        $mpdf->SetTitle('تقرير المصاريف');
        $this->branding->applyWatermark($mpdf, $logoPath);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="expenses-report.pdf"');
    }
}
