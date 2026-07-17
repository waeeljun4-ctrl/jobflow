<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function vapidPublicKey()
    {
        return response(config('services.vapid.public_key'), 200)
            ->header('Content-Type', 'text/plain');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'endpoint' => 'required|string|max:500',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => $request->user()->id,
                'type' => 'webpush',
                'p256dh' => $data['keys']['p256dh'],
                'auth_key' => $data['keys']['auth'],
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate(['endpoint' => 'required|string']);

        PushSubscription::where('endpoint', $data['endpoint'])->delete();

        return response()->json(['ok' => true]);
    }
}
