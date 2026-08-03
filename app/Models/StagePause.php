<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StagePause extends Model
{
    protected $fillable = [
        'stage_instance_id', 'paused_by', 'type', 'reason', 'paused_at', 'resumed_at',
    ];

    protected function casts(): array
    {
        return [
            'paused_at' => 'datetime',
            'resumed_at' => 'datetime',
        ];
    }

    public function stageInstance()
    {
        return $this->belongsTo(StageInstance::class);
    }

    public function pausedByUser()
    {
        return $this->belongsTo(User::class, 'paused_by');
    }

    public function isOpen(): bool
    {
        return $this->resumed_at === null;
    }
}
