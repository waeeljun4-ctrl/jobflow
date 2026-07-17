import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard({ workers, workersCount, workersActiveCount, ordersInProgress, ordersCompleted, stageCounts, inProgressCount, recentOrders }) {
    const [showWorkers, setShowWorkers] = useState(false);

    function previewAs(workerId) {
        router.post(`/admin/users/${workerId}/impersonate`);
    }

    return (
        <AdminLayout title="لوحة التحكم">
            <Head title="لوحة التحكم" />

            <Link href="/intake"
                className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex items-center justify-between hover:border-primary hover:shadow-sm transition-all">
                <div>
                    <p className="font-bold text-ink">➕ طلبية جديدة</p>
                    <p className="text-xs text-muted mt-0.5">انقر لتسجيل طلبية جديدة</p>
                </div>
                <span className="text-2xl font-black text-primary">+</span>
            </Link>

            <Link href="/admin/execution"
                className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex items-center justify-between hover:border-primary hover:shadow-sm transition-all">
                <div>
                    <p className="font-bold text-ink">🔥 قيد التنفيذ الآن</p>
                    <p className="text-xs text-muted mt-0.5">{inProgressCount} مهمة قيد التنفيذ حالياً — انقر لعرض كل التفاصيل</p>
                </div>
                <span className="text-2xl font-black text-primary">{inProgressCount}</span>
            </Link>

            <button type="button" onClick={() => setShowWorkers(v => !v)}
                className="w-full text-right bg-white rounded-2xl border border-cream-3 p-5 flex items-center justify-between hover:border-primary hover:shadow-sm transition-all">
                <div>
                    <p className="font-bold text-ink">👥 العمال</p>
                    <p className="text-xs text-muted mt-0.5">{workersActiveCount} نشط حالياً من أصل {workersCount} — انقر لعرض القائمة ومعاينة شاشة أي عامل</p>
                </div>
                <span className="text-2xl font-black text-primary">{workersCount}</span>
            </button>

            {showWorkers && (
                <div className="bg-white rounded-2xl border border-cream-3 mt-1 max-h-64 overflow-y-auto divide-y divide-cream-3">
                    {workers.map(w => (
                        <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-ink text-sm">{w.name}</p>
                                <p className="text-xs text-muted mt-0.5">{w.active ? '🟢 يعمل حالياً' : '⚪ غير نشط حالياً'}</p>
                            </div>
                            <button type="button" onClick={() => previewAs(w.id)} className="text-primary hover:underline text-xs font-bold">
                                👁️ معاينة شاشته
                            </button>
                        </div>
                    ))}
                    {workers.length === 0 && (
                        <div className="px-5 py-6 text-center text-muted text-sm">لا يوجد عمال بعد</div>
                    )}
                </div>
            )}

            <div className="mb-6" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard href="/admin/orders?status=in_progress" label="طلبيات قيد التنفيذ" value={ordersInProgress} color="text-primary" />
                <StatCard href="/admin/orders?status=completed" label="طلبيات مكتملة" value={ordersCompleted} color="text-stage-done" />
                {stageCounts.map(s => (
                    <StatCard key={s.id} href={`/admin/stages/${s.id}/queue`} label={s.label} value={s.count} color="text-stage-progress" />
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <div className="px-5 py-3 border-b border-cream-3 font-bold text-ink">أحدث الطلبيات</div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map(order => (
                            <tr key={order.id} className="border-t border-cream-3">
                                <td className="px-5 py-3">
                                    <Link href={`/orders/${order.id}`} className="text-primary font-bold hover:underline">
                                        {order.order_number}
                                    </Link>
                                </td>
                                <td className="px-5 py-3">{order.customer_name}</td>
                                <td className="px-5 py-3">{order.status_label}</td>
                            </tr>
                        ))}
                        {recentOrders.length === 0 && (
                            <tr><td colSpan={3} className="px-5 py-6 text-center text-muted">لا يوجد طلبيات بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function StatCard({ href, label, value, color }) {
    return (
        <Link href={href} className="bg-white rounded-2xl border border-cream-3 p-4 block hover:border-primary hover:shadow-sm transition-all">
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
        </Link>
    );
}
