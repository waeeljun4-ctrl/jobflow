import axios from 'axios';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function pushSubscriptionStatus() {
    if (!isPushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';

    const registration = await navigator.serviceWorker.getRegistration();
    const existing = registration ? await registration.pushManager.getSubscription() : null;

    return existing ? 'subscribed' : 'unsubscribed';
}

export async function subscribeToPush() {
    if (!isPushSupported()) throw new Error('المتصفح لا يدعم الإشعارات.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('لم يتم منح إذن الإشعارات.');

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const { data: vapidPublicKey } = await axios.get('/push/vapid-public-key');

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    }

    await axios.post('/push-subscriptions', subscription.toJSON());

    return subscription;
}

export async function unsubscribeFromPush() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;

    if (subscription) {
        await axios.delete('/push-subscriptions', { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
    }
}
