<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SpecField;
use App\Models\StageDefinition;
use App\Models\User;
use App\Services\ImageCompressionService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class OrderController extends Controller
{
    /**
     * Pricing/deposit info is sensitive — only admins and whoever the admin
     * has explicitly granted 'order.pricing' can see or touch it (toggle
     * per worker any time from Admin > Users > Permissions), independent of
     * their stage assignments. Everyone else never sees a price or deposit
     * figure anywhere in the app.
     */
    private function canSeePricing(User $user): bool
    {
        return $user->isAdmin() || $user->can('order.pricing');
    }

    public function show(Order $order)
    {
        $order->load(['stageDefinitions', 'specValues.specField', 'creator', 'images', 'quote.items']);

        $allStages = $order->stageInstances()
            ->with(['stageDefinition', 'assignedUser', 'completedByUser', 'transitions'])
            ->orderBy('id')
            ->get();

        $user = request()->user();
        $gate = Gate::forUser($user);

        $visibleStages = $user->isAdmin()
            ? $allStages
            : $allStages->filter(fn ($stage) => $gate->allows('view', $stage))->values();

        // A held order (on_hold — awaiting the customer's quote approval)
        // has no stage instances yet by design, so $visibleStages is always
        // empty for it. Without this, the worker who just created it via
        // intake gets 403'd the instant they're redirected to view it.
        $isCreator = $order->created_by === $user->id;

        if (! $user->isAdmin() && ! $isCreator && $visibleStages->isEmpty()) {
            throw new AccessDeniedHttpException('لا تملك صلاحية عرض هذه الطلبية.');
        }

        // Pricing is admin/designer-only — stripped from the payload
        // entirely for everyone else, not just hidden in the UI, so it
        // never reaches their browser.
        if (! $this->canSeePricing($user)) {
            $order->makeHidden(['price', 'deposit_amount', 'deposit_payment_method', 'remaining_balance', 'quote']);
        }

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'stages' => $visibleStages,
            'canEdit' => $gate->allows('edit', $order),
            'editLogs' => $user->isAdmin() ? $order->editLogs()->with('user:id,name')->get() : [],
        ]);
    }

    public function edit(Order $order)
    {
        Gate::authorize('edit', $order);

        $order->load('specValues');

        // Same rule as show(): pricing is admin/designer-only, stripped
        // entirely rather than just hidden in the UI.
        if (! $this->canSeePricing(request()->user())) {
            $order->makeHidden(['price', 'deposit_amount', 'deposit_payment_method', 'remaining_balance', 'quote']);
        }

        $stageOptions = StageDefinition::where('is_active', true)
            ->where('is_conditional', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (StageDefinition $stage) => [
                'id' => $stage->id,
                'name_ar' => $stage->name_ar,
                'workers' => User::permission($stage->permissionName())->orderBy('name')->get(['id', 'name']),
            ])->values();

        $stageInstances = $order->stageInstances()->orderBy('id')->get(['id', 'stage_definition_id', 'status', 'assigned_to']);

        return Inertia::render('Orders/Edit', [
            'order' => $order,
            'specFields' => SpecField::where('is_active', true)->orderBy('sort_order')->get(),
            'stageOptions' => $stageOptions,
            'stageInstances' => $stageInstances,
        ]);
    }

    /**
     * Arabic labels for the order-edit audit log — only the fields a
     * worker can actually change from the edit form are trackable here.
     */
    private const EDIT_LOG_FIELD_LABELS = [
        'customer_name' => 'اسم العميل',
        'customer_phone' => 'رقم الهاتف',
        'customer_address' => 'العنوان',
        'notes' => 'الملاحظات',
        'due_date' => 'تاريخ التسليم',
        'price' => 'السعر',
        'deposit_amount' => 'العربون',
        'deposit_payment_method' => 'طريقة دفع العربون',
    ];

    public function update(Request $request, Order $order, ImageCompressionService $imageCompressor)
    {
        Gate::authorize('edit', $order);

        $canEditPricing = $this->canSeePricing($request->user());

        $data = $request->validate(array_merge([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'specs' => 'nullable|array',
            'images' => 'nullable|array',
            'images.*' => 'image|max:8192',
            'delete_image_ids' => 'nullable|array',
            'delete_image_ids.*' => 'integer',
        ], $canEditPricing ? [
            'price' => 'nullable|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_payment_method' => 'nullable|in:cash,bank_transfer,check',
        ] : []));

        // Snapshot before the write — getChanges() isn't reliable here
        // (Eloquent flags an untouched null-valued field as "changed" the
        // moment it's explicitly re-passed as null), so the audit trail
        // compares its own before/after values instead, string-normalized
        // so null and '' count as equal.
        $before = $order->only(array_keys(self::EDIT_LOG_FIELD_LABELS));

        $order->update(array_merge([
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'customer_address' => $data['customer_address'] ?? null,
            'notes' => $data['notes'] ?? null,
            'due_date' => $data['due_date'] ?? null,
        ], $canEditPricing ? [
            'price' => $data['price'] ?? null,
            'deposit_amount' => $data['deposit_amount'] ?? null,
            'deposit_payment_method' => $data['deposit_payment_method'] ?? null,
        ] : []));

        $after = $order->only(array_keys(self::EDIT_LOG_FIELD_LABELS));
        $changedLabels = [];
        foreach (self::EDIT_LOG_FIELD_LABELS as $field => $label) {
            if ((string) ($before[$field] ?? '') !== (string) ($after[$field] ?? '')) {
                $changedLabels[] = $label;
            }
        }

        $activeFields = SpecField::where('is_active', true)->pluck('id');
        $specsChanged = false;
        foreach ($data['specs'] ?? [] as $specFieldId => $value) {
            if (! $activeFields->contains($specFieldId)) {
                continue;
            }
            if ($value === null || $value === '') {
                if ($order->specValues()->where('spec_field_id', $specFieldId)->delete()) {
                    $specsChanged = true;
                }
                continue;
            }
            $specValue = $order->specValues()->updateOrCreate(
                ['spec_field_id' => $specFieldId],
                ['value' => is_array($value) ? json_encode($value) : $value]
            );
            if ($specValue->wasRecentlyCreated || $specValue->wasChanged()) {
                $specsChanged = true;
            }
        }
        if ($specsChanged) {
            $changedLabels[] = 'المواصفات';
        }

        $imagesChanged = false;
        foreach ($data['delete_image_ids'] ?? [] as $imageId) {
            $image = $order->images()->find($imageId);
            if ($image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
                $imagesChanged = true;
            }
        }

        $remainingSlots = max(0, 10 - $order->images()->count());
        $newImages = array_slice($request->file('images', []) ?? [], 0, $remainingSlots);
        foreach ($newImages as $image) {
            if (! $image instanceof UploadedFile) {
                continue;
            }
            $path = $imageCompressor->compressAndStore($image, 'order-images');
            $order->images()->create([
                'path' => $path,
                'uploaded_by' => $request->user()->id,
            ]);
            $imagesChanged = true;
        }
        if ($imagesChanged) {
            $changedLabels[] = 'الصور';
        }

        if (! empty($changedLabels)) {
            $order->editLogs()->create([
                'user_id' => $request->user()->id,
                'changed_fields' => $changedLabels,
            ]);
        }

        return redirect()->route('orders.show', $order)->with('success', 'تم تحديث بيانات الطلبية.');
    }

    /**
     * Lets whoever can edit this order change which stages it actually
     * needs (not every order needs installation, some already have a ready
     * design file) and who specifically should work each one — separate
     * from update() since it mutates the workflow graph, not plain fields.
     */
    public function updateStages(Request $request, Order $order, WorkflowService $workflow)
    {
        Gate::authorize('edit', $order);

        $data = $request->validate([
            'stage_definition_ids' => 'required|array|min:1',
            'stage_definition_ids.*' => 'exists:stage_definitions,id',
            'stage_assignments' => 'nullable|array',
            'stage_assignments.*' => 'nullable|integer|exists:users,id',
        ]);

        $workflow->assertAssignmentsEligible($data['stage_assignments'] ?? []);

        try {
            $workflow->syncStages($order, $data['stage_definition_ids'], $data['stage_assignments'] ?? [], $request->user());
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['stage_definition_ids' => $e->getMessage()]);
        }

        return redirect()->route('orders.show', $order)->with('success', 'تم تحديث مراحل العمل.');
    }
}
