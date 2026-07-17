<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StageInstance;
use App\Services\TaskVisibilityService;
use App\Services\WorkflowService;
use Illuminate\Http\Request;

class TaskApiController extends Controller
{
    public function index(Request $request, TaskVisibilityService $visibility)
    {
        $tasks = $visibility->visibleTo($request->user())->get();

        return response()->json(['tasks' => $tasks]);
    }

    public function show(Request $request, StageInstance $stageInstance)
    {
        $this->authorize('view', $stageInstance);

        $stageInstance->load(['order.stageDefinitions', 'order.specValues.specField', 'order.images', 'stageDefinition', 'dependsOn.stageDefinition']);

        return response()->json(['task' => $stageInstance]);
    }

    public function start(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('start', $stageInstance);

        $workflow->startStage($stageInstance, $request->user());

        return response()->json(['ok' => true]);
    }

    public function complete(Request $request, StageInstance $stageInstance, WorkflowService $workflow)
    {
        $this->authorize('complete', $stageInstance);

        $workflow->completeStage($stageInstance, $request->user());

        return response()->json(['ok' => true]);
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

        return response()->json(['ok' => true]);
    }
}
