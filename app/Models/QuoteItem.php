<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuoteItem extends Model
{
    protected $fillable = [
        'quote_id', 'description', 'unit_price', 'quantity', 'line_total', 'notes', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function measurements()
    {
        return $this->hasMany(QuoteItemMeasurement::class)->orderBy('sort_order');
    }
}
