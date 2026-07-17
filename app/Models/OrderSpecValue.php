<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderSpecValue extends Model
{
    protected $fillable = ['order_id', 'spec_field_id', 'value'];

    public function specField()
    {
        return $this->belongsTo(SpecField::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
