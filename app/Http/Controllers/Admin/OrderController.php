<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StageStatus;
use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\Order;
use App\Services\PdfBrandingService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(private PdfBrandingService $branding)
    {
    }

    public function index(Request $request)
    {
        $filters = $this->filtersFromRequest($request);

        $orders = $this->filteredOrdersQuery($filters)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Orders', [
            'orders' => $orders,
            'filters' => $filters,
        ]);
    }

    /**
     * Same filters as index(), but a real PDF listing every matching order
     * with its price and a grand total — the "print what I'm looking at,
     * with a sum" report the admin asked for. Kept admin-only regardless
     * of who has the `page.orders` permission, since pricing is admin-only
     * data everywhere else in the app too.
     */
    public function printList(Request $request)
    {
        $filters = $this->filtersFromRequest($request);

        $orders = $this->filteredOrdersQuery($filters)
            ->orderBy('created_at')
            ->get();

        $company = CompanySetting::current();
        $logoPath = $company->logo_path && Storage::disk('public')->exists($company->logo_path)
            ? Storage::disk('public')->path($company->logo_path)
            : null;

        [$accentColor, $accentLight] = $this->branding->extractAccentColor($logoPath);
        [$logoWidth, $logoHeight] = $this->branding->fitLogoBox($logoPath);

        $html = view('orders-print', [
            'orders' => $orders,
            'company' => $company,
            'logoPath' => $logoPath,
            'accentColor' => $accentColor,
            'accentLight' => $accentLight,
            'logoWidth' => $logoWidth,
            'logoHeight' => $logoHeight,
            'filters' => $filters,
            'total' => $orders->sum('price'),
        ])->render();

        $mpdf = $this->branding->makePdf();
        $mpdf->SetTitle('تقرير الطلبيات');
        $this->branding->applyWatermark($mpdf, $logoPath);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="orders-report.pdf"');
    }

    private function filtersFromRequest(Request $request): array
    {
        return [
            'status' => $request->string('status')->toString(),
            'search' => $request->string('search')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];
    }

    private function filteredOrdersQuery(array $filters)
    {
        return Order::with('stageDefinitions')
            ->when($filters['status'] === 'completed', fn ($q) => $q->where('status', 'completed'))
            ->when($filters['status'] === 'in_progress', fn ($q) => $q->where('status', '!=', 'completed'))
            ->when($filters['search'] !== '', fn ($q) => $q->where(fn ($q2) => $q2
                ->where('customer_name', 'like', "%{$filters['search']}%")
                ->orWhere('order_number', 'like', "%{$filters['search']}%")
                ->orWhere('customer_phone', 'like', "%{$filters['search']}%")))
            ->when($filters['from'] !== '', fn ($q) => $q->whereDate('created_at', '>=', $filters['from']))
            ->when($filters['to'] !== '', fn ($q) => $q->whereDate('created_at', '<=', $filters['to']));
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return back()->with('success', 'تم نقل الطلبية لسلة المحذوفات.');
    }

    /**
     * Manual admin override — closes every remaining stage instance (even
     * ones not yet started) instead of just flipping the order's status
     * label, so a worker's task queue never keeps showing a stage that the
     * admin already force-completed from the order's own page.
     */
    public function complete(Order $order)
    {
        DB::transaction(function () use ($order) {
            $order->stageInstances()
                ->where('status', '!=', StageStatus::Done->value)
                ->get()
                ->each(fn ($stage) => $stage->update([
                    'status' => StageStatus::Done->value,
                    'completed_at' => now(),
                    'completed_by' => request()->user()->id,
                ]));

            $order->update(['status' => 'completed']);
        });

        return back()->with('success', 'تم تحديد الطلبية كمكتملة وأُغلقت كل مراحل العمل عليها.');
    }

    public function trashed()
    {
        $orders = Order::onlyTrashed()
            ->with('stageDefinitions')
            ->orderByDesc('deleted_at')
            ->paginate(20);

        return Inertia::render('Admin/OrdersTrash', ['orders' => $orders]);
    }

    public function restore(int $order)
    {
        Order::onlyTrashed()->findOrFail($order)->restore();

        return back()->with('success', 'تم استرجاع الطلبية.');
    }

    public function pending()
    {
        $orders = Order::with('quote.items')
            ->where('on_hold', true)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/OrdersPending', ['orders' => $orders]);
    }

    public function release(Request $request, Order $order, WorkflowService $workflow)
    {
        abort_unless($order->on_hold, 404);

        $workflow->initializeStages($order, $request->user());
        $order->update(['status' => 'intake', 'on_hold' => false]);

        return redirect()->route('orders.show', $order)->with('success', 'تم إرسال الطلبية للتصميم.');
    }
}
