<?php

namespace App\Services;

use App\Enums\StageStatus;
use App\Models\StageDefinition;
use App\Models\StageInstance;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TaskVisibilityService
{
    /**
     * The single query deciding what a worker can see, reused by both the
     * web "my tasks" page and the mobile tasks API so they never drift.
     */
    public function visibleTo(User $user): Builder
    {
        $query = StageInstance::query()
            ->with(['order', 'stageDefinition', 'dependsOn.stageDefinition'])
            ->where('status', '!=', StageStatus::Locked->value)
            ->whereHas('order')
            ->where(function ($q) use ($user) {
                $q->whereNull('assigned_to')->orWhere('assigned_to', $user->id);
            });

        if ($user->isAdmin()) {
            return $query->orderBy('queue_order');
        }

        $permissions = $user->getAllPermissions()->pluck('name');

        $allowedDefinitionIds = StageDefinition::query()
            ->get()
            ->filter(fn (StageDefinition $d) => $permissions->contains($d->permissionName()))
            ->pluck('id');

        return $query->whereIn('stage_definition_id', $allowedDefinitionIds)->orderBy('queue_order');
    }
}
