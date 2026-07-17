<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SpecField;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class OrderController extends Controller
{
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

        // Pricing is admin-only — stripped from the payload entirely for
        // workers, not just hidden in the UI, so it never reaches their browser.
        if (! $user->isAdmin()) {
            $order->makeHidden(['price', 'deposit_amount', 'deposit_payment_method', 'remaining_balance', 'quote']);
        }

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'stages' => $visibleStages,
            'canEdit' => $gate->allows('edit', $order),
        ]);
    }

    public function edit(Order $order)
    {
        Gate::authorize('edit', $order);

        $order->load('specValues');

        return Inertia::render('Orders/Edit', [
            'order' => $order,
            'specFields' => SpecField::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request, Order $order, ImageCompressionService $imageCompressor)
    {
        Gate::authorize('edit', $order);

        $data = $request->validate([
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'specs' => 'nullable|array',
            'images' => 'nullable|array',
            'images.*' => 'image|max:8192',
            'delete_image_ids' => 'nullable|array',
            'delete_image_ids.*' => 'integer',
        ]);

        $order->update([
            'customer_address' => $data['customer_address'] ?? null,
            'notes' => $data['notes'] ?? null,
            'due_date' => $data['due_date'] ?? null,
        ]);

        $activeFields = SpecField::where('is_active', true)->pluck('id');
        foreach ($data['specs'] ?? [] as $specFieldId => $value) {
            if (! $activeFields->contains($specFieldId)) {
                continue;
            }
            if ($value === null || $value === '') {
                $order->specValues()->where('spec_field_id', $specFieldId)->delete();
                continue;
            }
            $order->specValues()->updateOrCreate(
                ['spec_field_id' => $specFieldId],
                ['value' => is_array($value) ? json_encode($value) : $value]
            );
        }

        foreach ($data['delete_image_ids'] ?? [] as $imageId) {
            $image = $order->images()->find($imageId);
            if ($image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
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
        }

        return redirect()->route('orders.show', $order)->with('success', 'تم تحديث بيانات الطلبية.');
    }
}
