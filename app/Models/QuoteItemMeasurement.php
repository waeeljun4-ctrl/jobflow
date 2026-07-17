<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuoteItemMeasurement extends Model
{
    protected $fillable = ['quote_item_id', 'type', 'length_cm', 'width_cm', 'pieces', 'area_m2', 'sort_order'];

    protected function casts(): array
    {
        return [
            'length_cm' => 'decimal:2',
            'width_cm' => 'decimal:2',
            'area_m2' => 'decimal:2',
        ];
    }

    public function item()
    {
        return $this->belongsTo(QuoteItem::class, 'quote_item_id');
    }
}
