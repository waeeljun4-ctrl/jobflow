<?php

namespace App\Http\Controllers;

use App\Models\StageInstance;
use App\Services\TaskVisibilityService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Request $request, TaskVisibilityService $visibility)
    {
        $tasks = $visibility->visibleTo($request->user())->get();

        return Inertia::render('Worker/Tasks', [
            'tasks' => $tasks,
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
            'reason' => 'nullable|string|max:255',
        ]);

        $target = StageInstance::findOrFail($data['target_stage_instance_id']);

        $workflow->sendBack($stageInstance, $target, $request->user(), $data['reason'] ?? null);

        return back()->with('success', 'تم إرجاع الطلبية للمرحلة السابقة.');
    }
}
