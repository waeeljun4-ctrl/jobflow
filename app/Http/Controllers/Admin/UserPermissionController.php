<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StageDefinition;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserPermissionController extends Controller
{
    /**
     * Static admin-page access grants — deliberately excludes
     * users/customers/company-settings, which stay admin-only regardless.
     */
    private const PAGE_PERMISSIONS = [
        ['name' => 'page.dashboard', 'label' => 'لوحة التحكم'],
        ['name' => 'page.execution', 'label' => 'قيد التنفيذ'],
        ['name' => 'page.orders_pending', 'label' => 'بانتظار الموافقة'],
        ['name' => 'page.orders', 'label' => 'الطلبات'],
        ['name' => 'page.quotes', 'label' => 'عروض الأسعار'],
        ['name' => 'page.stages', 'label' => 'المراحل والأعمال'],
        ['name' => 'page.spec_fields', 'label' => 'المواصفات'],
        ['name' => 'page.inventory', 'label' => 'المخزن'],
    ];

    /**
     * Individual action grants that don't map to a whole admin page.
     */
    private const ACTION_PERMISSIONS = [
        ['name' => 'order.complete', 'label' => 'تحديد الطلبية كمكتملة'],
        ['name' => 'order.edit', 'label' => 'تعديل الطلبية'],
    ];

    public function edit(User $user)
    {
        $stages = StageDefinition::where('is_active', true)->orderBy('sort_order')->get();

        $mandatoryStages = $stages->where('is_conditional', false)->map(fn ($s) => [
            'name' => $s->permissionName(),
            'label' => $s->name_ar,
        ])->values();

        $conditionalStages = $stages->where('is_conditional', true)->map(fn ($s) => [
            'name' => $s->permissionName(),
            'label' => $s->name_ar,
        ])->values();

        return Inertia::render('Admin/UserPermissions', [
            'targetUser' => $user->only('id', 'name', 'email', 'role'),
            'mandatoryStages' => $mandatoryStages,
            'conditionalStages' => $conditionalStages,
            'pagePermissions' => self::PAGE_PERMISSIONS,
            'actionPermissions' => self::ACTION_PERMISSIONS,
            'grantedPermissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'string',
        ]);

        $user->syncPermissions($data['permissions'] ?? []);

        return back()->with('success', 'تم تحديث صلاحيات العامل.');
    }
}
