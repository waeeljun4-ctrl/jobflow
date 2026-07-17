<?php

namespace App\Jobs;

use App\Models\PushSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, int>  $userIds
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public array $userIds,
        public string $title,
        public string $body,
        public array $data = [],
    ) {
    }

    public function handle(): void
    {
        $subscriptions = PushSubscription::whereIn('user_id', $this->userIds)->get();

        $this->sendExpo($subscriptions->where('type', 'expo'));
        $this->sendWebPush($subscriptions->where('type', 'webpush'));
    }

    private function sendExpo(Collection $subs): void
    {
        if ($subs->isEmpty()) {
            return;
        }

        $messages = $subs->map(fn (PushSubscription $s) => [
            'to' => $s->expo_token,
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data,
            'sound' => 'default',
        ])->values()->all();

        foreach (array_chunk($messages, 100) as $chunk) {
            $response = Http::post('https://exp.host/--/api/v2/push/send', $chunk);

            if ($response->failed()) {
                Log::warning('Expo push send failed', ['status' => $response->status(), 'body' => $response->body()]);
            }
        }
    }

    private function sendWebPush(Collection $subs): void
    {
        if ($subs->isEmpty()) {
            return;
        }

        if (! config('services.vapid.public_key') || ! config('services.vapid.private_key')) {
            Log::warning('Web push skipped: VAPID keys not configured.');

            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ]);

        $payload = json_encode([
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data,
        ]);

        foreach ($subs as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->p256dh,
                    'authToken' => $sub->auth_key,
                ]),
                $payload
            );
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            } elseif (! $report->isSuccess()) {
                Log::warning('Web push send failed', ['endpoint' => $report->getEndpoint(), 'reason' => $report->getReason()]);
            }
        }
    }
}
