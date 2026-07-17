<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpecField;
use App\Models\StageDefinition;

class ReferenceController extends Controller
{
    public function stages()
    {
        return response()->json([
            'stages' => StageDefinition::where('is_active', true)->where('is_conditional', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function specFields()
    {
        return response()->json([
            'spec_fields' => SpecField::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }
}
