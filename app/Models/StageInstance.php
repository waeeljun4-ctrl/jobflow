<?php

namespace App\Models;

use App\Enums\StageStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class StageInstance extends Model
{
    protected $fillable = [
        'order_id', 'stage_definition_id', 'status', 'queue_order', 'assigned_to',
        'started_at', 'completed_at', 'completed_by', 'notes',
    ];

    protected $appends = ['elapsed_hours', 'last_send_back_reason'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Hours from when a worker clicked "بدء العمل" to completion (or to now,
     * if still in progress) — this is what lets the admin see how long a
     * stage has actually been worked on, not just its current status.
     * Friday (the workshop's day off) is excluded from the count.
     */
    protected function elapsedHours(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->started_at) {
                    return null;
                }

                $end = $this->completed_at ?? now();

                return round($this->workingMinutesBetween($this->started_at, $end) / 60, 1);
            },
        );
    }

    /**
     * The reason from the most recent transition that carried one — set
     * whenever a stage gets reopened or cascade-locked by a "send back"
     * (see WorkflowService::sendBack). Null once nothing was ever rolled
     * back for this stage instance.
     */
    protected function lastSendBackReason(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('transitions')
                ? $this->transitions->whereNotNull('reason')->sortByDesc('created_at')->first()?->reason
                : null,
        );
    }

    private function workingMinutesBetween(Carbon $start, Carbon $end): int
    {
        if ($start->greaterThanOrEqualTo($end)) {
            return 0;
        }

        $minutes = 0;
        $cursor = $start->copy();

        while ($cursor->lessThan($end)) {
            $nextMidnight = $cursor->copy()->addDay()->startOfDay();
            $segmentEnd = $nextMidnight->lessThan($end) ? $nextMidnight : $end;

            if ($cursor->dayOfWeek !== Carbon::FRIDAY) {
                $minutes += $cursor->diffInMinutes($segmentEnd);
            }

            $cursor = $segmentEnd;
        }

        return $minutes;
    }

    /**
     * Shared by the dashboard's "in progress now" widget and the dedicated
     * execution page so they never drift on what counts as "active work."
     */
    public function scopeCurrentlyInProgress($query)
    {
        return $query->where('status', StageStatus::InProgress->value)
            ->whereHas('order')
            ->with(['order', 'stageDefinition', 'assignedUser'])
            ->orderByDesc('started_at');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function stageDefinition()
    {
        return $this->belongsTo(StageDefinition::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedByUser()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function dependsOn()
    {
        return $this->belongsToMany(
            StageInstance::class,
            'stage_dependencies',
            'stage_instance_id',
            'depends_on_stage_instance_id'
        );
    }

    public function dependents()
    {
        return $this->belongsToMany(
            StageInstance::class,
            'stage_dependencies',
            'depends_on_stage_instance_id',
            'stage_instance_id'
        );
    }

    public function transitions()
    {
        return $this->hasMany(StageTransition::class);
    }

    public function isLocked(): bool
    {
        return $this->status === StageStatus::Locked->value;
    }

    public function isDone(): bool
    {
        return $this->status === StageStatus::Done->value;
    }

    /**
     * The permission name required to view/act on this stage instance.
     */
    public function requiredPermission(): string
    {
        return $this->stageDefinition->permissionName();
    }
}
