import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function WorkerHours({ workers }) {
    return (
        <AdminLayout title="ساعات عمل العمال">
            <Head title="ساعات عمل العمال" />

            <p className="text-sm text-muted mb-4 max-w-2xl">
                مجموع الساعات الفعلية يلي اشتغلها كل عامل على كل مهامه — بدون ما تحسب الليل، يوم الجمعة، أو أي فترة كان فيها العامل متوقف (نقص مادة أو خارج الدوام).
                اضغط على أي عامل لتشوف سجله اليومي والشهري وتطبعه.
            </p>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">العامل</th>
                            <th className="px-5 py-2">مجموع ساعات العمل</th>
                            <th className="px-5 py-2">عدد المهام</th>
                            <th className="px-5 py-2">قيد التنفيذ الآن</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(worker => (
                            <tr key={worker.id} className="border-t border-cream-3 hover:bg-cream-2 transition-colors">
                                <td className="px-5 py-3 font-bold text-ink">
                                    <Link href={`/admin/worker-hours/${worker.id}`} className="hover:text-primary hover:underline">
                                        {worker.name}
                                    </Link>
                                </td>
                                <td className="px-5 py-3 font-black text-primary">{worker.total_hours} ساعة</td>
                                <td className="px-5 py-3 text-muted">{worker.tasks_count}</td>
                                <td className="px-5 py-3">
                                    {worker.active_count > 0 ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                                            {worker.active_count}
                                        </span>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-left">
                                    <Link href={`/admin/worker-hours/${worker.id}`} className="text-xs font-bold text-primary hover:underline">
                                        السجل التفصيلي ←
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {workers.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا يوجد عمال بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
