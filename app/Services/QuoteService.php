<?php

namespace App\Services;

use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QuoteService
{
    public function create(array $data, User $creator): Quote
    {
        return DB::transaction(function () use ($data, $creator) {
            $quote = Quote::create([
                'quote_number' => $this->nextQuoteNumber(),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'quote_date' => $data['quote_date'] ?? now()->toDateString(),
                'valid_until' => $data['valid_until'] ?? now()->addDays(30)->toDateString(),
                'notes' => $data['notes'] ?? null,
                'created_by' => $creator->id,
            ]);

            $this->syncItems($quote, $data['items']);

            return $quote->load('items.measurements');
        });
    }

    public function update(Quote $quote, array $data): Quote
    {
        return DB::transaction(function () use ($quote, $data) {
            $quote->update([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'quote_date' => $data['quote_date'] ?? $quote->quote_date,
                'valid_until' => $data['valid_until'] ?? $quote->valid_until,
                'notes' => $data['notes'] ?? null,
            ]);

            // Measurements cascade-delete with their item (FK onDelete).
            $quote->items()->delete();
            $this->syncItems($quote, $data['items']);

            return $quote->load('items.measurements');
        });
    }

    /**
     * @param  array<int, array{description:string,unit_price:float,quantity?:float,notes?:string,measurements?:array<int,array{type?:string,length_cm?:float,width_cm?:float,pieces?:int}>}>  $items
     */
    private function syncItems(Quote $quote, array $items): void
    {
        foreach ($items as $index => $itemData) {
            $measurements = $itemData['measurements'] ?? [];
            $quantity = $itemData['quantity'] ?? 0;
            $measurementRows = [];

            // Dimension rows are the source of truth for quantity when
            // present — the manual "quantity" input is only used for items
            // with no measurement rows at all.
            if (! empty($measurements)) {
                $quantity = 0;
                foreach (array_values($measurements) as $position => $m) {
                    $type = $m['type'] ?? 'area';
                    $pieces = (int) ($m['pieces'] ?? 1);
                    $length = isset($m['length_cm']) && $m['length_cm'] !== '' ? (float) $m['length_cm'] : null;
                    $width = isset($m['width_cm']) && $m['width_cm'] !== '' ? (float) $m['width_cm'] : null;

                    // area: length x width in cm -> m2. linear: length in cm
                    // -> running meters (width is a fixed roll width, not
                    // part of the math). piece: just a count, no dimensions.
                    $contribution = match ($type) {
                        'linear' => round(($length / 100) * $pieces, 2),
                        'piece' => (float) $pieces,
                        default => round(($length * $width / 10000) * $pieces, 2),
                    };

                    $quantity += $contribution;
                    $measurementRows[] = [
                        'type' => $type,
                        'length_cm' => $type === 'piece' ? null : $length,
                        'width_cm' => $type === 'area' ? $width : null,
                        'pieces' => $pieces,
                        'area_m2' => $contribution,
                        'sort_order' => $position,
                    ];
                }
                $quantity = round($quantity, 2);
            }

            $item = $quote->items()->create([
                'description' => $itemData['description'],
                'unit_price' => $itemData['unit_price'],
                'quantity' => $quantity,
                'line_total' => round($quantity * (float) $itemData['unit_price'], 2),
                'notes' => $itemData['notes'] ?? null,
                'sort_order' => $index,
            ]);

            if (! empty($measurementRows)) {
                $item->measurements()->createMany($measurementRows);
            }
        }
    }

    /**
     * Q-YYYY-MM-NNNN — same monthly-reset scheme as order numbers, kept in
     * its own sequence so quotes and orders never collide.
     */
    private function nextQuoteNumber(): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $count = Quote::withTrashed()
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count() + 1;

        return sprintf('Q-%s-%s-%04d', $year, $month, $count);
    }
}
