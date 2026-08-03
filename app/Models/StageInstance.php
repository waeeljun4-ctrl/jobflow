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

    protected $appends = ['elapsed_hours', 'last_send_back_reason', 'current_pause'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Hours actually worked: the raw started_at→completed_at span, minus
     * Fridays (the workshop's day off), minus every paused interval
     * (material shortage or the worker simply going home) — so a stage left
     * "in progress" overnight or over a pause doesn't inflate the count.
     */
    protected function elapsedHours(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->started_at) {
                    return null;
                }

                $end = $this->completed_at ?? now();

                $workingMinutes = $this->workingMinutesBetween($this->started_at, $end);
                $pausedMinutes = $this->pausedMinutesBetween($end);

                return round(max(0, $workingMinutes - $pausedMinutes) / 60, 1);
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

    /**
     * The currently-open pause (still-blocked shortage, or "went home" not
     * yet resumed), if any — null once resumed. Relies on `pauses` being
     * eager-loaded (see TaskVisibilityService); falls back to a query
     * otherwise so this is never wrong, just occasionally an extra query.
     */
    protected function currentPause(): Attribute
    {
        return Attribute::make(
            get: fn () => ($this->relationLoaded('pauses') ? $this->pauses : $this->pauses()->get())
                ->first(fn ($p) => $p->resumed_at === null),
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

        return (int) $minutes;
    }

    /**
     * Sum of every pause interval (shortage or end-of-day), open ones
     * counted up to $end. A pause that happens to span a Friday gets
     * subtracted at face value even though that Friday was already excluded
     * from workingMinutesBetween — elapsedHours floors at 0, so the only
     * effect is a negligible undercount in that rare edge case, not a
     * negative or broken number.
     */
    private function pausedMinutesBetween(Carbon $end): int
    {
        $pauses = $this->relationLoaded('pauses') ? $this->pauses : $this->pauses()->get();

        return (int) $pauses->sum(fn ($p) => $p->paused_at->diffInMinutes($p->resumed_at ?? $end));
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

    /**
     * Stages currently blocked by a missing material — deliberately only
     * 'shortage' pauses, not 'end_of_day' ones (going home isn't a problem
     * for the admin to solve). Shared by the admin's dedicated page.
     */
    public function scopeCurrentlyPaused($query)
    {
        return $query->whereHas('pauses', fn ($q) => $q->whereNull('resumed_at')->where('type', 'shortage'))
            ->whereHas('order')
            ->with(['order', 'stageDefinition', 'assignedUser', 'pauses' => fn ($q) => $q->whereNull('resumed_at')])
            ->orderByDesc('id');
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

    public function pauses()
    {
        return $this->hasMany(StagePause::class);
    }

    public function isLocked(): bool
    {
        return $this->status === StageStatus::Locked->value;
    }

    public function isDone(): bool
    {
        return $this->status === StageStatus::Done->value;
    }

    public function isPaused(): bool
    {
        return ($this->relationLoaded('pauses') ? $this->pauses : $this->pauses()->get())
            ->contains(fn ($p) => $p->resumed_at === null);
    }

    /**
     * The permission name required to view/act on this stage instance.
     */
    public function requiredPermission(): string
    {
        return $this->stageDefinition->permissionName();
    }
}
