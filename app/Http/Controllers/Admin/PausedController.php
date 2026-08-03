<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StageInstance;
use App\Services\WorkflowService;
use Inertia\Inertia;

class PausedController extends Controller
{
    /**
     * Orders currently blocked by a missing material — deliberately
     * excludes "end of day" pauses, which aren't a problem for the admin
     * to solve, just workers being off-shift.
     */
    public function index()
    {
        return Inertia::render('Admin/Paused', [
            'instances' => StageInstance::currentlyPaused()->get(),
        ]);
    }

    /**
     * The admin resolved the shortage on the worker's behalf (bought the
     * material, etc.) — resuming here doesn't require the worker to be the
     * one who clicks it.
     */
    public function resume(StageInstance $stageInstance, WorkflowService $workflow)
    {
        $workflow->resumeStage($stageInstance);

        return back()->with('success', 'تم استئناف العمل على المرحلة.');
    }
}
