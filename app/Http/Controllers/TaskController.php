<?php

namespace App\Http\Controllers;

use App\Models\StageInstance;
use App\Models\StagePause;
use App\Services\TaskVisibilityService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Request $request, TaskVisibilityService $visibility)
    {
        $tasks = $visibility->visibleTo($request->user())->get();

        $offShift = StagePause::whereNull('resumed_at')
            ->where('type', 'end_of_day')
            ->whereHas('stageInstance', fn ($q) => $q->where('assigned_to', $request->user()->id))
            ->exists();

        return Inertia::render('Worker/Tasks', [
            'tasks' => $tasks,
            'offShift' => $offShift,
        ]);
    }

    public function start(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('start', $stageInstance);

        $workflow->startStage($stageInstance, $request->user());

        return back()->with('success', 'تم بدء العمل على المرحلة.');
    }

    public function complete(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('complete', $stageInstance);

        $workflow->completeStage($stageInstance, $request->user());

        return back()->with('success', 'تم إنهاء المرحلة.');
    }

    public function sendBack(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('sendBack', $stageInstance);

        $data = $request->validate([
            'target_stage_instance_id' => 'required|integer|exists:stage_instances,id',
            'reason' => 'required|string|max:255',
        ]);

        $target = StageInstance::findOrFail($data['target_stage_instance_id']);

        $workflow->sendBack($stageInstance, $target, $request->user(), $data['reason']);

        return back()->with('success', 'تم إرجاع الطلبية للمرحلة السابقة.');
    }

    public function pause(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('pause', $stageInstance);

        $data = $request->validate([
            'type' => 'required|in:shortage,end_of_day',
            'reason' => 'required_if:type,shortage|nullable|string|max:255',
        ]);

        $workflow->pauseStage($stageInstance, $request->user(), $data['type'], $data['reason'] ?? null);

        $message = $data['type'] === 'shortage' ? 'تم إيقاف المرحلة مؤقتاً.' : 'تم تسجيل توقف الدوام.';

        return back()->with('success', $message);
    }

    public function resume(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('resume', $stageInstance);

        $workflow->resumeStage($stageInstance);

        return back()->with('success', 'تم استئناف العمل على المرحلة.');
    }

    /**
     * Global "رايح عالبيت" — pauses every active task assigned to the
     * worker at once, so they don't have to open each order individually.
     */
    public function endShift(Request $request, WorkflowService $workflow)
    {
        $count = $workflow->endShift($request->user());

        return back()->with('success', $count > 0 ? "تم إنهاء الدوام على {$count} مهمة." : 'ما في مهام نشطة لإيقافها.');
    }

    public function startShift(Request $request, WorkflowService $workflow)
    {
        $count = $workflow->startShift($request->user());

        return back()->with('success', $count > 0 ? "تم استئناف العمل على {$count} مهمة." : 'ما في دوام متوقف لاستئنافه.');
    }
}
