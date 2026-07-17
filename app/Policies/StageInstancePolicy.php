<?php

namespace App\Policies;

use App\Enums\StageStatus;
use App\Models\StageInstance;
use App\Models\User;

class StageInstancePolicy
{
    public function view(User $user, StageInstance $stage): bool
    {
        return $this->canAct($user, $stage, allowLocked: true);
    }

    public function start(User $user, StageInstance $stage): bool
    {
        return $this->canAct($user, $stage) && $stage->status === StageStatus::Available->value;
    }

    public function complete(User $user, StageInstance $stage): bool
    {
        return $this->canAct($user, $stage)
            && in_array($stage->status, [StageStatus::Available->value, StageStatus::InProgress->value], true);
    }

    public function sendBack(User $user, StageInstance $stage): bool
    {
        return $this->canAct($user, $stage)
            && in_array($stage->status, [StageStatus::Available->value, StageStatus::InProgress->value], true)
            && $stage->dependsOn()->exists();
    }

    private function canAct(User $user, StageInstance $stage, bool $allowLocked = false): bool
    {
        if (! $allowLocked && $stage->isLocked()) {
            return false;
        }

        if (! $user->hasPermissionTo($stage->requiredPermission())) {
            return false;
        }

        return $stage->assigned_to === null || $stage->assigned_to === $user->id;
    }
}
