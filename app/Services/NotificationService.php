<?php

namespace App\Services;

use App\Jobs\SendPushNotification;
use App\Models\StageInstance;
use App\Models\User;

class NotificationService
{
    /**
     * Push to every user holding the permission a stage requires — the same
     * check TaskVisibilityService uses to decide who can see it, so "who
     * gets notified" and "who can act on it" never drift apart.
     *
     * @param  array<string, mixed>  $data
     */
    public function notifyStageEligibleUsers(StageInstance $stage, string $title, string $body, array $data = []): void
    {
        $userIds = User::permission($stage->requiredPermission())->pluck('id')->all();

        if (empty($userIds)) {
            return;
        }

        SendPushNotification::dispatch($userIds, $title, $body, $data);
    }
}
