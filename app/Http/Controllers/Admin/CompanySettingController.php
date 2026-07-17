<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanySettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('Admin/CompanySettings', [
            'settings' => CompanySetting::current(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);

        $settings = CompanySetting::current();

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('company', 'public');
        }
        unset($data['logo']);

        $settings->update($data);

        return back()->with('success', 'تم حفظ بيانات الشركة.');
    }
}
