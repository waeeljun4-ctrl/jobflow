<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionApiController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            ['expo_token' => $data['token']],
            ['user_id' => $request->user()->id, 'type' => 'expo']
        );

        return response()->json(['ok' => true]);
    }
}
