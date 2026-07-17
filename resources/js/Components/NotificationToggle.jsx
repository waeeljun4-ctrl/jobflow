import { useEffect, useState } from 'react';
import { isPushSupported, pushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from '@/push';

export default function NotificationToggle({ className = '' }) {
    const [status, setStatus] = useState('checking');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isPushSupported()) {
            setStatus('unsupported');
            return;
        }
        pushSubscriptionStatus().then(setStatus);
    }, []);

    async function toggle() {
        setBusy(true);
        try {
            if (status === 'subscribed') {
                await unsubscribeFromPush();
                setStatus('unsubscribed');
            } else {
                await subscribeToPush();
                setStatus('subscribed');
            }
        } catch (err) {
            alert(err.message || 'تعذّر تفعيل الإشعارات');
        } finally {
            setBusy(false);
        }
    }

    if (status === 'unsupported' || status === 'checking') return null;

    return (
        <button onClick={toggle} disabled={busy || status === 'denied'}
            title={status === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : ''}
            className={className}>
            {status === 'subscribed' ? '🔔 الإشعارات مفعّلة' : status === 'denied' ? '🔕 محظورة من المتصفح' : '🔕 تفعيل الإشعارات'}
        </button>
    );
}
