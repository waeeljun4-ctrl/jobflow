import { usePage, router } from '@inertiajs/react';

export default function ImpersonationBanner() {
    const { auth } = usePage().props;
    if (!auth?.impersonating) return null;

    function stop() {
        router.post('/stop-impersonating');
    }

    return (
        <div className="bg-amber-400 text-ink px-4 py-2 flex items-center justify-between gap-3 text-sm font-bold z-40">
            <span>👁️ أنت تشاهد التطبيق الآن كما يظهر لـ {auth.user?.name} — هذا معاينة حقيقية لشاشته</span>
            <button onClick={stop} className="bg-ink text-white px-3 py-1 rounded-lg text-xs shrink-0 hover:bg-primary transition-colors">
                رجوع لحسابي ({auth.impersonatorName})
            </button>
        </div>
    );
}
