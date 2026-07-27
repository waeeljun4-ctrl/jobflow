<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Editing an order's details (customer info, specs, images, pricing,
     * stage reassignment) requires the standing "order.edit" permission —
     * on its own, having an active stage on the order only lets a worker
     * start/complete/send back *that stage*, not touch anything else about
     * the order. Admins bypass this entirely via Gate::before.
     */
    public function edit(User $user, Order $order): bool
    {
        return $user->hasPermissionTo('order.edit');
    }
}
