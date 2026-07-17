<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    public $timestamps = false;

    protected $fillable = ['inventory_item_id', 'change', 'reason', 'user_id'];

    protected function casts(): array
    {
        return [
            'change' => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
