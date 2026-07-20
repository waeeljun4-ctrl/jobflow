<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StageDefinition extends Model
{
    use HasFactory;

    protected $fillable = ['name_ar', 'name_en', 'slug', 'sort_order', 'is_conditional', 'default_selected', 'is_intake', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_conditional' => 'boolean',
            'default_selected' => 'boolean',
            'is_intake' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function permissionName(): string
    {
        return "stage.{$this->slug}";
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_stage_selections');
    }

    public function stageInstances()
    {
        return $this->hasMany(StageInstance::class);
    }
}
