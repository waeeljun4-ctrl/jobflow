<?php

namespace App\Http\Controllers;

use App\Models\SpecField;
use App\Models\StageDefinition;
use App\Models\User;
use App\Services\OrderIntakeService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderIntakeController extends Controller
{
    public function create()
    {
        $stages = StageDefinition::where('is_active', true)->where('is_conditional', true)->orderBy('sort_order')->get();

        $conditionalStages = $stages->map(fn (StageDefinition $stage) => [
            'id' => $stage->id,
            'name_ar' => $stage->name_ar,
            'default_selected' => $stage->default_selected,
            'workers' => User::permission($stage->permissionName())->orderBy('name')->get(['id', 'name']),
        ])->values();

        return Inertia::render('Intake/Create', [
            'conditionalStages' => $conditionalStages,
            'specFields' => SpecField::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request, OrderIntakeService $intakeService, WorkflowService $workflow)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'stage_definition_ids' => 'required|array|min:1',
            'stage_definition_ids.*' => 'exists:stage_definitions,id',
            'stage_assignments' => 'nullable|array',
            'stage_assignments.*' => 'nullable|integer|exists:users,id',
            'specs' => 'nullable|array',
            'price' => 'nullable|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_payment_method' => 'nullable|in:cash,bank_transfer,check',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|max:8192',
            'send_to_design' => 'nullable|boolean',
            'quote_items' => 'nullable|array',
            'quote_items.*.description' => 'required_with:quote_items|string|max:255',
            'quote_items.*.unit_price' => 'required_with:quote_items|numeric|min:0',
            'quote_items.*.quantity' => 'nullable|numeric|min:0',
            'quote_items.*.notes' => 'nullable|string|max:255',
            'quote_items.*.measurements' => 'nullable|array',
            'quote_items.*.measurements.*.type' => 'nullable|in:area,linear,piece',
            'quote_items.*.measurements.*.length_cm' => 'nullable|numeric|min:0.1',
            'quote_items.*.measurements.*.width_cm' => 'nullable|numeric|min:0.1',
            'quote_items.*.measurements.*.pieces' => 'nullable|integer|min:1',
        ]);

        $workflow->assertAssignmentsEligible($data['stage_assignments'] ?? []);

        $order = $intakeService->create($data, $request->user());

        return redirect()->route('orders.show', $order)->with('success', 'تم تسجيل الطلبية بنجاح: '.$order->order_number);
    }
}
