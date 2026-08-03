<?php

namespace App\Services;

use App\Models\StageInstance;
use App\Models\User;
use Carbon\Carbon;

/**
 * Builds a per-day, per-order breakdown of a worker's actual worked hours —
 * "Saturday 11/6: 10 hours, on order #JF-005 (Mohammad) and #JF-008 (Emad)"
 * — for the printable daily/monthly worker-hours report.
 *
 * Reuses the same midnight-walk + Friday-skip technique as
 * StageInstance::workingMinutesBetween, but keyed by calendar day instead of
 * summed into one total, and subtracts each pause's overlap with that day's
 * segment specifically (more precise than the aggregate elapsed_hours
 * calculation, which subtracts a pause's full duration regardless of which
 * day it fell on — here a pause spanning midnight is split correctly
 * between both days).
 */
class WorkHoursReportService
{
    /**
     * @return array<string, array{total_minutes: int, orders: array<int, array{order_number: string, customer_name: string, minutes: int}>}>
     *         keyed by date (Y-m-d), sorted chronologically
     */
    public function dailyLogForWorker(User $worker): array
    {
        $instances = StageInstance::where('assigned_to', $worker->id)
            ->whereNotNull('started_at')
            ->with(['pauses', 'order'])
            ->get();

        $days = [];

        foreach ($instances as $instance) {
            if (! $instance->order) {
                continue;
            }

            foreach ($this->dailyMinutes($instance) as $date => $minutes) {
                if ($minutes <= 0) {
                    continue;
                }

                $days[$date]['total_minutes'] = ($days[$date]['total_minutes'] ?? 0) + $minutes;

                $orderId = $instance->order_id;
                $existing = $days[$date]['orders'][$orderId] ?? ['minutes' => 0];
                $days[$date]['orders'][$orderId] = [
                    'order_number' => $instance->order->order_number,
                    'customer_name' => $instance->order->customer_name,
                    'minutes' => $existing['minutes'] + $minutes,
                ];
            }
        }

        ksort($days);

        return $days;
    }

    /**
     * Same daily log, rolled up to one total per calendar month (Y-m).
     *
     * @param  array<string, array{total_minutes: int}>  $dailyLog
     * @return array<string, int> month (Y-m) => total minutes
     */
    public function monthlyTotals(array $dailyLog): array
    {
        $months = [];

        foreach ($dailyLog as $date => $day) {
            $month = substr($date, 0, 7);
            $months[$month] = ($months[$month] ?? 0) + $day['total_minutes'];
        }

        ksort($months);

        return $months;
    }

    /**
     * @return array<string, int> date (Y-m-d) => minutes worked that day
     */
    private function dailyMinutes(StageInstance $instance): array
    {
        if (! $instance->started_at) {
            return [];
        }

        $start = $instance->started_at;
        $end = $instance->completed_at ?? now();

        if ($start->greaterThanOrEqualTo($end)) {
            return [];
        }

        $buckets = [];
        $cursor = $start->copy();

        while ($cursor->lessThan($end)) {
            $nextMidnight = $cursor->copy()->addDay()->startOfDay();
            $segmentEnd = $nextMidnight->lessThan($end) ? $nextMidnight : $end;

            if ($cursor->dayOfWeek !== Carbon::FRIDAY) {
                $minutes = (int) $cursor->diffInMinutes($segmentEnd);
                $minutes -= $this->pausedMinutesInSegment($instance, $cursor, $segmentEnd);

                $date = $cursor->toDateString();
                $buckets[$date] = ($buckets[$date] ?? 0) + max(0, $minutes);
            }

            $cursor = $segmentEnd;
        }

        return $buckets;
    }

    private function pausedMinutesInSegment(StageInstance $instance, Carbon $segmentStart, Carbon $segmentEnd): int
    {
        $minutes = 0;

        foreach ($instance->pauses as $pause) {
            $pauseStart = $pause->paused_at;
            $pauseEnd = $pause->resumed_at ?? now();

            $overlapStart = $pauseStart->greaterThan($segmentStart) ? $pauseStart : $segmentStart;
            $overlapEnd = $pauseEnd->lessThan($segmentEnd) ? $pauseEnd : $segmentEnd;

            if ($overlapEnd->greaterThan($overlapStart)) {
                $minutes += (int) $overlapStart->diffInMinutes($overlapEnd);
            }
        }

        return $minutes;
    }
}
