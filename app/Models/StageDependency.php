<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StageDependency extends Model
{
    protected $fillable = ['stage_instance_id', 'depends_on_stage_instance_id'];

    public function stageInstance()
    {
        return $this->belongsTo(StageInstance::class, 'stage_instance_id');
    }

    public function dependsOnStageInstance()
    {
        return $this->belongsTo(StageInstance::class, 'depends_on_stage_instance_id');
    }
}
