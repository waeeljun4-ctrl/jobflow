<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StageTransition extends Model
{
    public $timestamps = false;

    protected $fillable = ['stage_instance_id', 'from_status', 'to_status', 'user_id', 'reason'];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function stageInstance()
    {
        return $this->belongsTo(StageInstance::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
