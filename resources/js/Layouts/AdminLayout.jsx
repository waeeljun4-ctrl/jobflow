import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import NotificationToggle from '@/Components/NotificationToggle';

export default function AdminLayout({ children, title }) {
    const { url, props } = usePage();
    const { auth } = props;
    const isAdmin = auth?.user?.role === 'admin';
    const permissions = auth?.permissions ?? [];
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        (isAdmin || permissions.includes('page.dashboard')) && { href: '/admin', label: 'لوحة التحكم', icon: '📊' },
        (isAdmin || permissions.includes('page.execution')) && { href: '/admin/execution', label: 'قيد التنفيذ', icon: '🔥' },
        (isAdmin || permissions.includes('page.orders_pending')) && { href: '/admin/orders/pending', label: 'بانتظار الموافقة', icon: '⏳' },
        (isAdmin || permissions.includes('page.orders')) && { href: '/admin/orders', label: 'الطلبات', icon: '📦' },
        isAdmin && { href: '/admin/orders/trash', label: 'سلة المحذوفات', icon: '🗑️' },
        isAdmin && { href: '/admin/customers', label: 'الزبائن', icon: '🧑‍🤝‍🧑' },
        (isAdmin || permissions.includes('page.quotes')) && { href: '/admin/quotes', label: 'عروض الأسعار', icon: '🧮' },
        (isAdmin || permissions.includes('stage.intake')) && { href: '/intake', label: 'استلام طلبية', icon: '📝' },
        (isAdmin || permissions.includes('page.stages')) && { href: '/admin/stages', label: 'المراحل والأعمال', icon: '🏭' },
        (isAdmin || permissions.includes('page.spec_fields')) && { href: '/admin/spec-fields', label: 'المواصفات', icon: '🧾' },
        (isAdmin || permissions.includes('page.inventory')) && { href: '/admin/inventory', label: 'المخزن', icon: '🏬' },
        isAdmin && { href: '/admin/users', label: 'العمال', icon: '👥' },
        isAdmin && { href: '/admin/settings/company', label: 'بيانات الشركة', icon: '⚙️' },
        { href: '/profile', label: 'الحساب', icon: '🔑' },
        { href: '/my/tasks', label: 'مهامي', icon: '✅' },
    ].filter(Boolean);

    function logout() {
        router.post('/logout');
    }

    return (
        <div className="min-h-screen bg-cream-2 font-cairo flex flex-col">
            <ImpersonationBanner />
            <div className="flex flex-1">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`w-56 bg-ink flex flex-col shrink-0 fixed top-0 bottom-0 right-0 z-30
                transition-transform duration-300 lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-white/10">
                    <p className="text-primary-light font-black text-lg">Job<span className="text-white">Flow</span></p>
                    <p className="text-white/30 text-xs mt-0.5 tracking-widest">لوحة الإدارة</p>
                </div>
                <nav className="flex-1 p-3 overflow-y-auto">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm mb-1 transition-colors
                                ${url.startsWith(item.href) ? 'bg-primary text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/10">
                    <button onClick={logout}
                        className="w-full flex items-center gap-2 text-white/40 text-xs hover:text-red-400 transition-colors px-3 py-2 text-right">
                        🚪 تسجيل الخروج
                    </button>
                </div>
            </aside>

            <main className="flex-1 lg:mr-56 flex flex-col min-h-screen">
                <header className="bg-white border-b border-cream-3 px-6 py-4 sticky top-0 z-20 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)}
                        className="lg:hidden shrink-0 text-ink text-2xl leading-none" aria-label="فتح القائمة">
                        ☰
                    </button>
                    <h1 className="font-black text-ink text-lg flex-1">{title}</h1>
                    <NotificationToggle className="text-muted hover:text-ink text-xs font-bold shrink-0" />
                </header>

                <FlashMessages />

                <div className="flex-1 p-6">
                    {children}
                </div>
            </main>
            </div>
        </div>
    );
}

function FlashMessages() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    return (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-xl font-bold text-sm ${flash.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {flash.success || flash.error}
        </div>
    );
}
