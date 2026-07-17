<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecField;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SpecFieldController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/SpecFields', [
            'specFields' => SpecField::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'label_ar' => 'required|string|max:255',
            'label_en' => 'nullable|string|max:255',
            'field_type' => 'required|in:text,number,textarea,select,boolean,date',
            'options' => 'nullable|array',
            'options.*' => 'string',
            'is_required' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data['key'] = Str::slug($data['label_en'] ?? $data['label_ar'], '_') ?: Str::random(8);
        $data['sort_order'] = $data['sort_order'] ?? 0;

        SpecField::create($data);

        return back()->with('success', 'تمت إضافة حقل المواصفات.');
    }

    public function update(Request $request, SpecField $specField)
    {
        $data = $request->validate([
            'label_ar' => 'required|string|max:255',
            'label_en' => 'nullable|string|max:255',
            'field_type' => 'required|in:text,number,textarea,select,boolean,date',
            'options' => 'nullable|array',
            'options.*' => 'string',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $specField->update($data);

        return back()->with('success', 'تم تحديث حقل المواصفات.');
    }

    public function destroy(SpecField $specField)
    {
        if ($specField->orderSpecValues()->exists()) {
            return back()->with('error', 'لا يمكن حذف حقل مستخدم في طلبيات — يمكنك تعطيله بدلاً من ذلك.');
        }

        $specField->delete();

        return back()->with('success', 'تم حذف حقل المواصفات.');
    }
}
