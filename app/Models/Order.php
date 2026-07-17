<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id', 'order_number', 'customer_name', 'customer_phone', 'customer_address',
        'notes', 'status', 'created_by', 'due_date',
        'price', 'deposit_amount', 'deposit_payment_method',
        'quote_id', 'on_hold',
    ];

    protected $appends = ['status_label', 'remaining_balance'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'on_hold' => 'boolean',
        ];
    }

    /**
     * `status` stores a stage slug (or "completed"/"on_hold") for cheap
     * filtering — this resolves it to the admin's actual Arabic stage name
     * for display, since stage names/slugs are fully admin-configurable now.
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match ($this->status) {
                'completed' => 'مكتمل',
                'on_hold' => 'بانتظار الموافقة على السعر',
                default => StageDefinition::where('slug', $this->status)->value('name_ar') ?? $this->status,
            },
        );
    }

    protected function remainingBalance(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->price === null ? null : round($this->price - $this->deposit_amount, 2),
        );
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function stageDefinitions()
    {
        return $this->belongsToMany(StageDefinition::class, 'order_stage_selections');
    }

    public function specValues()
    {
        return $this->hasMany(OrderSpecValue::class);
    }

    public function stageInstances()
    {
        return $this->hasMany(StageInstance::class);
    }

    public function images()
    {
        return $this->hasMany(OrderImage::class);
    }
}
