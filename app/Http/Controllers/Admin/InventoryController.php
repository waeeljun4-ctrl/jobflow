<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Inventory', [
            'items' => InventoryItem::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'quantity' => 'nullable|numeric|min:0',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $openingQuantity = (float) ($data['quantity'] ?? 0);

        DB::transaction(function () use ($data, $openingQuantity, $request) {
            $item = InventoryItem::create([
                'name' => $data['name'],
                'unit' => $data['unit'],
                'quantity' => $openingQuantity,
                'low_stock_threshold' => $data['low_stock_threshold'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            if ($openingQuantity > 0) {
                $item->movements()->create([
                    'change' => $openingQuantity,
                    'reason' => 'رصيد افتتاحي',
                    'user_id' => $request->user()->id,
                ]);
            }
        });

        return back()->with('success', 'تمت إضافة الصنف.');
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $inventoryItem->update($data);

        return back()->with('success', 'تم تحديث الصنف.');
    }

    /**
     * The only path that ever changes `quantity` — every change, in either
     * direction, is logged to inventory_movements so the running total is
     * always reconstructable and never a bare unaccountable edit.
     */
    public function adjustQuantity(Request $request, InventoryItem $inventoryItem)
    {
        $data = $request->validate([
            'change' => 'required|numeric',
            'reason' => 'nullable|string|max:255',
        ]);

        $change = (float) $data['change'];

        if ($change === 0.0) {
            return back()->with('error', 'أدخل كمية أكبر أو أصغر من صفر.');
        }

        if ($inventoryItem->quantity + $change < 0) {
            throw ValidationException::withMessages([
                'change' => 'الكمية المطلوب سحبها أكبر من الرصيد المتوفر ('.$inventoryItem->quantity.' '.$inventoryItem->unit.').',
            ]);
        }

        DB::transaction(function () use ($inventoryItem, $change, $data, $request) {
            $inventoryItem->increment('quantity', $change);
            $inventoryItem->movements()->create([
                'change' => $change,
                'reason' => $data['reason'] ?? null,
                'user_id' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'تم تحديث الكمية.');
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->delete();

        return back()->with('success', 'تم حذف الصنف.');
    }
}
