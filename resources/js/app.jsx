import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { route } from 'ziggy-js';
import '../css/app.css';

// A response that isn't a valid Inertia response (expired/mismatched
// session, CSRF token rotated by the impersonation swap, etc.) would
// otherwise leave the page hung on a raw error. Reload instead — the
// browser lands on a fresh, correctly-authenticated page (usually the
// login screen), with a note explaining why.
router.on('invalid', (event) => {
    event.preventDefault();
    sessionStorage.setItem('sessionExpired', '1');
    window.location.reload();
});

createInertiaApp({
    title: (title) => `${title} — JobFlow`,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        window.route = (name, params, absolute) =>
            route(name, params, absolute, props.initialPage.props.ziggy);
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#2563EB',
    },
});
