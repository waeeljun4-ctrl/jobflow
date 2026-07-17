<?php

namespace App\Policies;

use App\Enums\StageStatus;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * A worker may edit an order's details while a stage on it is theirs to
     * act on right now — either already claimed and in progress, or sitting
     * available/unclaimed and assignable to them (so they can double-check
     * specs before pressing "بدء العمل", not just mid-task). Once that stage
     * is done, edit access closes again. Admins bypass this via Gate::before.
     */
    public function edit(User $user, Order $order): bool
    {
        return $order->stageInstances()
            ->whereIn('status', [StageStatus::Available->value, StageStatus::InProgress->value])
            ->where(fn ($q) => $q->whereNull('assigned_to')->orWhere('assigned_to', $user->id))
            ->with('stageDefinition')
            ->get()
            ->contains(fn ($stage) => $user->hasPermissionTo($stage->requiredPermission()));
    }
}
