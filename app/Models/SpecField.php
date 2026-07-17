<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpecField extends Model
{
    use HasFactory;

    protected $fillable = [
        'key', 'label_ar', 'label_en', 'field_type', 'options', 'is_required', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function orderSpecValues()
    {
        return $this->hasMany(OrderSpecValue::class);
    }
}
