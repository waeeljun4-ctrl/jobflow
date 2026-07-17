<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'name', 'unit', 'quantity', 'low_stock_threshold', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'low_stock_threshold' => 'float',
            'is_active' => 'boolean',
        ];
    }

    protected function isLowStock(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->low_stock_threshold !== null && $this->quantity <= $this->low_stock_threshold,
        );
    }

    protected $appends = ['is_low_stock'];

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
