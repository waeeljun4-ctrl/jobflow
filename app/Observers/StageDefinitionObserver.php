<?php

namespace App\Observers;

use App\Models\StageDefinition;
use Spatie\Permission\Models\Permission;

class StageDefinitionObserver
{
    public function created(StageDefinition $stageDefinition): void
    {
        Permission::findOrCreate($stageDefinition->permissionName(), 'web');
    }
}
