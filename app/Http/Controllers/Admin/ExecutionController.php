<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StageInstance;
use Inertia\Inertia;

class ExecutionController extends Controller
{
    /**
     * A dedicated, always-reachable view of everything actively being
     * worked on right now, across every stage and every order — not just
     * a dashboard section, so the admin can jump straight here anytime.
     */
    public function index()
    {
        return Inertia::render('Admin/Execution', [
            'instances' => StageInstance::currentlyInProgress()->get(),
        ]);
    }
}
