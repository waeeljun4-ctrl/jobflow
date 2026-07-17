<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StageStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StageDefinition;
use App\Models\StageInstance;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stageCounts = StageDefinition::where('is_active', true)
            ->where('is_intake', false)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (StageDefinition $stage) => [
                'id' => $stage->id,
                'label' => $stage->name_ar,
                // Only count stages a worker can actually act on right now —
                // locked instances (waiting on an earlier stage) aren't real
                // pending work yet, so they shouldn't inflate this number.
                'count' => StageInstance::where('stage_definition_id', $stage->id)
                    ->whereIn('status', [StageStatus::Available->value, StageStatus::InProgress->value])
                    ->whereHas('order')
                    ->count(),
            ]);

        $activeWorkerIds = StageInstance::where('status', StageStatus::InProgress->value)
            ->whereNotNull('assigned_to')
            ->whereHas('order')
            ->distinct()
            ->pluck('assigned_to');

        $workers = User::where('role', 'worker')->orderBy('name')->get(['id', 'name'])
            ->map(fn (User $worker) => [
                'id' => $worker->id,
                'name' => $worker->name,
                'active' => $activeWorkerIds->contains($worker->id),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'workers' => $workers,
            'workersCount' => $workers->count(),
            'workersActiveCount' => $activeWorkerIds->count(),
            'ordersInProgress' => Order::where('status', '!=', 'completed')->count(),
            'ordersCompleted' => Order::where('status', 'completed')->count(),
            'stageCounts' => $stageCounts,
            'inProgressCount' => StageInstance::where('status', StageStatus::InProgress->value)->whereHas('order')->count(),
            'recentOrders' => Order::orderByDesc('created_at')->limit(8)->get(['id', 'order_number', 'customer_name', 'status', 'created_at']),
        ]);
    }
}
