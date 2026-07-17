import { Link, usePage, router } from '@inertiajs/react';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import NotificationToggle from '@/Components/NotificationToggle';
import { PERMISSION_LINKS } from '@/permissionLinks';

export default function WorkerLayout({ children, title }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];
    const quickLinks = PERMISSION_LINKS.filter(link => permissions.includes(link.name));

    function logout() {
        router.post('/logout');
    }

    return (
        <div className="min-h-screen bg-cream-2 font-cairo flex flex-col">
            <ImpersonationBanner />
            <header className="bg-ink text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <Link href="/my/tasks" className="font-black text-lg">
                    Job<span className="text-primary-light">Flow</span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60">{auth?.user?.name}</span>
                    <NotificationToggle className="text-white/50 hover:text-white text-xs" />
                    <Link href="/profile" className="text-white/50 hover:text-white text-xs">🔑 الحساب</Link>
                    <button onClick={logout} className="text-white/50 hover:text-red-400 text-xs">خروج</button>
                </div>
            </header>

            {quickLinks.length > 0 && (
                <div className="px-4 pt-3 flex flex-wrap gap-2">
                    {quickLinks.map(link => (
                        <Link key={link.name} href={link.href}
                            className="flex items-center gap-1.5 bg-primary text-white font-bold text-xs py-2 px-3 rounded-xl hover:bg-primary-dark transition-colors">
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}

            {title && (
                <div className="px-4 py-3 bg-white border-b border-cream-3">
                    <h1 className="font-black text-ink text-base">{title}</h1>
                </div>
            )}

            <FlashMessages />

            <main className="flex-1 p-4">
                {children}
            </main>
        </div>
    );
}

function FlashMessages() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    return (
        <div className={`mx-4 mt-3 px-4 py-3 rounded-xl font-bold text-sm ${flash.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {flash.success || flash.error}
        </div>
    );
}
