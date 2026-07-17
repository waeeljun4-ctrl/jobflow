self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = { title: 'JobFlow', body: event.data ? event.data.text() : '' };
    }

    const title = payload.title || 'JobFlow';
    const options = {
        body: payload.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data || {},
        dir: 'rtl',
        lang: 'ar',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/my/tasks');
        })
    );
});
