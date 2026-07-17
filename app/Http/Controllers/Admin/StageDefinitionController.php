<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StageStatus;
use App\Http\Controllers\Controller;
use App\Models\StageDefinition;
use App\Models\StageInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StageDefinitionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Stages', [
            'stages' => StageDefinition::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'is_conditional' => 'boolean',
        ]);

        $data['slug'] = Str::slug($data['name_en'] ?? $data['name_ar']) ?: Str::random(8);
        // New stages land at the end of the pipeline; the admin drags them
        // into position afterward on the Stages page.
        $data['sort_order'] = (int) StageDefinition::max('sort_order') + 10;

        StageDefinition::create($data);

        return back()->with('success', 'تمت إضافة المرحلة.');
    }

    public function update(Request $request, StageDefinition $stage)
    {
        $data = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'sort_order' => 'required|integer',
            'is_conditional' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($stage->is_intake) {
            // The intake stage's structural role (always non-conditional, always first)
            // isn't safe to change from the UI — only its display name is editable.
            unset($data['sort_order'], $data['is_conditional'], $data['is_active']);
        }

        $stage->update($data);

        return back()->with('success', 'تم تحديث المرحلة.');
    }

    /**
     * Bulk-updates sort_order from a drag-and-drop reorder on the admin
     * Stages page. Stages sharing a sort_order value are the parallel
     * group — the frontend computes that from drop position, this just
     * persists whatever it decided in one transaction.
     */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'stages' => 'required|array',
            'stages.*.id' => 'required|integer|exists:stage_definitions,id',
            'stages.*.sort_order' => 'required|integer',
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['stages'] as $row) {
                StageDefinition::where('id', $row['id'])
                    ->where('is_intake', false)
                    ->update(['sort_order' => $row['sort_order']]);
            }
        });

        return back()->with('success', 'تم تحديث ترتيب المراحل.');
    }

    /**
     * The drill-down behind a dashboard stage count: every order currently
     * sitting at this stage (available/in progress — the same statuses the
     * dashboard card counts), so the admin can see exactly what's queued.
     */
    public function queue(StageDefinition $stage)
    {
        $instances = StageInstance::where('stage_definition_id', $stage->id)
            ->whereIn('status', [StageStatus::Available->value, StageStatus::InProgress->value])
            ->whereHas('order')
            ->with(['order', 'assignedUser'])
            ->orderBy('queue_order')
            ->get();

        return Inertia::render('Admin/StageQueue', [
            'stage' => $stage,
            'instances' => $instances,
        ]);
    }

    /**
     * Admin manually reprioritizes a stage's queue (e.g. an order that came
     * in later but is urgent should be designed first) by drag-and-drop.
     */
    public function reorderQueue(Request $request, StageDefinition $stage)
    {
        $data = $request->validate([
            'instances' => 'required|array',
            'instances.*' => 'required|integer|exists:stage_instances,id',
        ]);

        DB::transaction(function () use ($data, $stage) {
            foreach ($data['instances'] as $index => $instanceId) {
                StageInstance::where('id', $instanceId)
                    ->where('stage_definition_id', $stage->id)
                    ->update(['queue_order' => $index]);
            }
        });

        return back()->with('success', 'تم تحديث ترتيب الأولوية.');
    }

    public function destroy(StageDefinition $stage)
    {
        if ($stage->is_intake) {
            return back()->with('error', 'لا يمكن حذف مرحلة استلام الطلبية.');
        }

        if ($stage->stageInstances()->exists() || $stage->orders()->exists()) {
            return back()->with('error', 'لا يمكن حذف مرحلة مستخدمة في طلبيات — يمكنك تعطيلها بدلاً من ذلك.');
        }

        $stage->delete();

        return back()->with('success', 'تم حذف المرحلة.');
    }
}
