<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderIntakeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class OrderApiController extends Controller
{
    public function store(Request $request, OrderIntakeService $intakeService)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'stage_definition_ids' => 'required|array|min:1',
            'stage_definition_ids.*' => 'exists:stage_definitions,id',
            'specs' => 'nullable|array',
            'price' => 'nullable|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_payment_method' => 'nullable|in:cash,bank_transfer,check',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|max:8192',
        ]);

        $order = $intakeService->create($data, $request->user());

        return response()->json(['order' => $order], 201);
    }

    public function show(Request $request, Order $order)
    {
        $order->load(['stageDefinitions', 'specValues.specField', 'images']);
        $allStages = $order->stageInstances()->with('stageDefinition')->orderBy('id')->get();

        $user = $request->user();
        $gate = Gate::forUser($user);

        $stages = $user->isAdmin()
            ? $allStages
            : $allStages->filter(fn ($stage) => $gate->allows('view', $stage))->values();

        // A held order (on_hold — awaiting the customer's quote approval)
        // has no stage instances yet by design, so $stages is always empty
        // for it. Without this, the worker who just created it via intake
        // gets 403'd the instant the app tries to show it.
        $isCreator = $order->created_by === $user->id;

        if (! $user->isAdmin() && ! $isCreator && $stages->isEmpty()) {
            throw new AccessDeniedHttpException('لا تملك صلاحية عرض هذه الطلبية.');
        }

        if (! $user->isAdmin()) {
            $order->makeHidden(['price', 'deposit_amount', 'deposit_payment_method', 'remaining_balance', 'quote']);
        }

        return response()->json(['order' => $order, 'stages' => $stages]);
    }
}
