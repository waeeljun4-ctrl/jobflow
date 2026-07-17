import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { route } from 'ziggy-js';
import '../css/app.css';

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
