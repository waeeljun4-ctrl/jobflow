// Every grantable, page-linked permission — shown as a nav item in
// AdminLayout's sidebar and as a quick-link button on the worker's home
// screen (WorkerLayout) whenever the logged-in user holds it. Keeping this
// list in one shared place means granting/revoking a permission from
// /admin/users/{id}/permissions immediately shows/hides the matching link
// in both places, with nothing to keep in sync by hand.
export const PERMISSION_LINKS = [
    { name: 'page.dashboard', label: 'لوحة التحكم', icon: '📊', href: '/admin' },
    { name: 'page.execution', label: 'قيد التنفيذ', icon: '🔥', href: '/admin/execution' },
    { name: 'page.orders_pending', label: 'بانتظار الموافقة', icon: '⏳', href: '/admin/orders/pending' },
    { name: 'page.orders', label: 'الطلبات', icon: '📦', href: '/admin/orders' },
    { name: 'page.quotes', label: 'عروض الأسعار', icon: '🧮', href: '/admin/quotes' },
    { name: 'stage.intake', label: 'استلام طلبية', icon: '📝', href: '/intake' },
    { name: 'page.stages', label: 'المراحل والأعمال', icon: '🏭', href: '/admin/stages' },
    { name: 'page.spec_fields', label: 'المواصفات', icon: '🧾', href: '/admin/spec-fields' },
    { name: 'page.inventory', label: 'المخزن', icon: '🏬', href: '/admin/inventory' },
];
