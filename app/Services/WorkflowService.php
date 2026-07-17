<?php

namespace App\Services;

use App\Enums\StageStatus;
use App\Models\Order;
use App\Models\StageDefinition;
use App\Models\StageInstance;
use App\Models\StageTransition;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class WorkflowService
{
    public function __construct(private NotificationService $notifications)
    {
    }

    /**
     * Build the full stage graph for a freshly-created order from whatever
     * StageDefinitions the admin currently has configured, and unlock
     * whatever is immediately available.
     *
     * Definitions sharing the same sort_order run in parallel (a "level").
     * Each level depends on the nearest lower level that actually produced
     * instances for this order — conditional stages nobody selected leave
     * no gap, since dependents attach to whatever level came before them.
     */
    public function initializeStages(Order $order, User $creator): void
    {
        DB::transaction(function () use ($order, $creator) {
            $intakeDefinition = StageDefinition::where('is_intake', true)->firstOrFail();

            $intake = StageInstance::create([
                'order_id' => $order->id,
                'stage_definition_id' => $intakeDefinition->id,
                'status' => StageStatus::Done->value,
                'completed_at' => now(),
                'completed_by' => $creator->id,
            ]);

            $selectedIds = $order->stageDefinitions()->pluck('stage_definitions.id')->all();

            $definitions = StageDefinition::where('is_active', true)
                ->where('is_intake', false)
                ->orderBy('sort_order')
                ->get();

            $levels = $definitions->groupBy('sort_order')->sortKeys();

            $previousLevelInstances = collect([$intake]);

            foreach ($levels as $levelDefinitions) {
                $levelInstances = collect();

                foreach ($levelDefinitions as $definition) {
                    $applies = ! $definition->is_conditional || in_array($definition->id, $selectedIds, true);

                    if (! $applies) {
                        continue;
                    }

                    $instance = StageInstance::create([
                        'order_id' => $order->id,
                        'stage_definition_id' => $definition->id,
                        'status' => StageStatus::Locked->value,
                        // New orders queue at the back of that stage's list;
                        // the admin can drag-reorder for priority afterward.
                        'queue_order' => (int) StageInstance::where('stage_definition_id', $definition->id)->max('queue_order') + 1,
                    ]);

                    $instance->dependsOn()->attach($previousLevelInstances->pluck('id'));
                    $levelInstances->push($instance);
                }

                if ($levelInstances->isNotEmpty()) {
                    $previousLevelInstances = $levelInstances;
                }
            }

            $newlyAvailable = $this->recomputeAvailability($order);

            foreach ($newlyAvailable as $next) {
                $this->notifications->notifyStageEligibleUsers(
                    $next,
                    '🔔 طلبية جديدة',
                    "{$creator->name} استلم طلبية جديدة {$order->order_number} — دورك الآن ({$next->stageDefinition->name_ar}).",
                    ['type' => 'stage_available', 'stage_instance_id' => $next->id, 'order_id' => $order->id]
                );
            }
        });
    }

    public function startStage(StageInstance $stage, User $user): void
    {
        if (! in_array($stage->status, [StageStatus::Available->value], true)) {
            throw new InvalidArgumentException('لا يمكن بدء هذه المرحلة في حالتها الحالية.');
        }

        // Starting work claims it — this is what lets the admin see who's
        // actually working on what, not just that "someone" started it.
        $this->transition($stage, StageStatus::InProgress->value, $user, [
            'started_at' => now(),
            'assigned_to' => $stage->assigned_to ?? $user->id,
        ]);
    }

    public function completeStage(StageInstance $stage, User $user): void
    {
        if (! in_array($stage->status, [StageStatus::Available->value, StageStatus::InProgress->value], true)) {
            throw new InvalidArgumentException('لا يمكن إنهاء هذه المرحلة في حالتها الحالية.');
        }

        DB::transaction(function () use ($stage, $user) {
            $this->transition($stage, StageStatus::Done->value, $user, [
                'completed_at' => now(),
                'completed_by' => $user->id,
            ]);

            $order = $stage->order;
            $newlyAvailable = $this->recomputeAvailability($order);
            $this->refreshOrderStatusCache($order);

            foreach ($newlyAvailable as $next) {
                $this->notifications->notifyStageEligibleUsers(
                    $next,
                    '🔔 مرحلة جديدة جاهزة',
                    "{$user->name} أنهى \"{$stage->stageDefinition->name_ar}\" — دورك الآن بطلبية {$order->order_number} ({$next->stageDefinition->name_ar}).",
                    ['type' => 'stage_available', 'stage_instance_id' => $next->id, 'order_id' => $order->id]
                );
            }
        });
    }

    /**
     * A worker at $stage found a problem caused by an earlier step and sends
     * the order back to $target — one of $stage's *direct* dependencies —
     * for rework. $target reopens, and everything downstream of it (which
     * includes $stage itself, plus anything already unlocked because $stage's
     * branch had progressed) re-locks, since its preconditions no longer
     * hold. Sibling branches $target doesn't gate (e.g. a parallel printing
     * step feeding the same assembly stage) are untouched — the cascade only
     * follows $target's own dependents graph.
     */
    public function sendBack(StageInstance $stage, StageInstance $target, User $user, ?string $reason = null): void
    {
        if (! $stage->dependsOn()->where('stage_instances.id', $target->id)->exists()) {
            throw new InvalidArgumentException('لا يمكن الإرجاع إلا لمرحلة سابقة مباشرة.');
        }

        DB::transaction(function () use ($stage, $target, $user, $reason) {
            $this->transition($target, StageStatus::Available->value, $user, [
                'started_at' => null,
                'completed_at' => null,
                'completed_by' => null,
            ], $reason);

            foreach ($this->downstreamOf($target) as $descendant) {
                if ($descendant->status === StageStatus::Locked->value) {
                    continue;
                }

                $this->transition($descendant, StageStatus::Locked->value, $user, [
                    'started_at' => null,
                    'completed_at' => null,
                    'completed_by' => null,
                ], $reason);
            }

            $this->refreshOrderStatusCache($target->order);

            $this->notifications->notifyStageEligibleUsers(
                $target,
                '↩ طلبية أُرجعت لمرحلتك',
                "{$user->name} أرجع طلبية {$target->order->order_number} من \"{$stage->stageDefinition->name_ar}\" — تحتاج إعادة عمل على \"{$target->stageDefinition->name_ar}\"".($reason ? ": {$reason}" : '.'),
                ['type' => 'stage_sent_back', 'stage_instance_id' => $target->id, 'order_id' => $target->order_id]
            );
        });
    }

    /**
     * Every stage instance transitively gated by $stage (its dependents,
     * their dependents, ...), via breadth-first traversal of the dependency
     * graph. Used to cascade a rollback forward through the pipeline.
     *
     * @return array<int, StageInstance>
     */
    private function downstreamOf(StageInstance $stage): array
    {
        $seen = [];
        $queue = [$stage];

        while ($queue) {
            $current = array_shift($queue);

            foreach ($current->dependents as $dependent) {
                if (isset($seen[$dependent->id])) {
                    continue;
                }
                $seen[$dependent->id] = $dependent;
                $queue[] = $dependent;
            }
        }

        return array_values($seen);
    }

    /**
     * Flip any locked stage on the order to available once every stage it
     * depends on is done. One generic query implements the branch/merge rule
     * regardless of how the admin has arranged the pipeline.
     */
    /**
     * @return array<int, StageInstance> stages that just flipped locked -> available
     */
    public function recomputeAvailability(Order $order): array
    {
        $stages = $order->stageInstances()->with(['dependsOn', 'stageDefinition'])->get();
        $unlocked = [];

        foreach ($stages as $stage) {
            if ($stage->status !== StageStatus::Locked->value) {
                continue;
            }

            $dependencies = $stage->dependsOn;
            if ($dependencies->isEmpty()) {
                continue;
            }

            $allDone = $dependencies->every(fn ($dep) => $dep->status === StageStatus::Done->value);

            if ($allDone) {
                $stage->update(['status' => StageStatus::Available->value]);
                $unlocked[] = $stage;
            }
        }

        return $unlocked;
    }

    public function refreshOrderStatusCache(Order $order): void
    {
        $stages = $order->stageInstances()->with('stageDefinition')->get();

        if ($stages->every(fn ($s) => $s->status === StageStatus::Done->value)) {
            $order->update(['status' => 'completed']);

            return;
        }

        $current = $stages
            ->where('status', '!=', StageStatus::Done->value)
            ->sortBy(fn ($s) => $s->stageDefinition->sort_order)
            ->first();

        $order->update(['status' => $current?->stageDefinition->slug ?? 'completed']);
    }

    private function transition(StageInstance $stage, string $toStatus, User $user, array $extra = [], ?string $reason = null): void
    {
        $fromStatus = $stage->status;

        $stage->update(array_merge(['status' => $toStatus], $extra));

        StageTransition::create([
            'stage_instance_id' => $stage->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'user_id' => $user->id,
            'reason' => $reason,
        ]);
    }
}
