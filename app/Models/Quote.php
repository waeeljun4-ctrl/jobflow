<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'quote_number', 'customer_name', 'customer_phone',
        'quote_date', 'valid_until', 'notes', 'created_by',
    ];

    protected $appends = ['total'];

    protected function casts(): array
    {
        return [
            'quote_date' => 'date',
            'valid_until' => 'date',
        ];
    }

    protected function total(): Attribute
    {
        return Attribute::make(
            get: fn () => round($this->items->sum('line_total'), 2),
        );
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(QuoteItem::class)->orderBy('sort_order');
    }
}
