import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function WorkerHoursDetail({ worker, daily, monthly }) {
    return (
        <AdminLayout title={`ساعات عمل ${worker.name}`}>
            <Head title={`ساعات عمل ${worker.name}`} />

            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <Link href="/admin/worker-hours" className="text-xs text-muted hover:underline">← كل العمال</Link>
                    <p className="text-lg font-black text-ink mt-1">{worker.name}</p>
                </div>
                <a href={`/admin/worker-hours/${worker.id}/print`} target="_blank" rel="noreferrer"
                    className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-colors">
                    🖨️ طباعة السجل
                </a>
            </div>

            {/* Monthly summary */}
            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden mb-6">
                <p className="px-5 py-3 border-b border-cream-3 font-bold text-sm text-ink">الملخص الشهري</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الشهر</th>
                            <th className="px-5 py-2">مجموع الساعات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthly.map(month => (
                            <tr key={month.month} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{month.label}</td>
                                <td className="px-5 py-3 font-black text-primary">{month.total_hours} ساعة</td>
                            </tr>
                        ))}
                        {monthly.length === 0 && (
                            <tr><td colSpan={2} className="px-5 py-6 text-center text-muted">لا يوجد بيانات</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Daily log */}
            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <p className="px-5 py-3 border-b border-cream-3 font-bold text-sm text-ink">السجل اليومي</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">التاريخ</th>
                            <th className="px-5 py-2">اليوم</th>
                            <th className="px-5 py-2">الساعات</th>
                            <th className="px-5 py-2">الطلبيات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {daily.map(day => (
                            <tr key={day.date} className="border-t border-cream-3">
                                <td className="px-5 py-3 text-muted">{day.date_label}</td>
                                <td className="px-5 py-3 text-muted">{day.day_name}</td>
                                <td className="px-5 py-3 font-black text-primary">{day.total_hours} ساعة</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {day.orders.map((order, i) => (
                                            <span key={i} className="bg-cream-2 rounded-lg px-2.5 py-1 text-xs">
                                                <span className="font-bold text-ink">{order.order_number}</span>
                                                <span className="text-muted"> ({order.customer_name} — {order.hours} س)</span>
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {daily.length === 0 && (
                            <tr><td colSpan={4} className="px-5 py-6 text-center text-muted">لا يوجد بيانات</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
