import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import CopyButton from '@/Components/CopyButton';

export default function Execution({ instances }) {
    return (
        <AdminLayout title="قيد التنفيذ">
            <Head title="قيد التنفيذ" />

            <p className="text-sm text-muted mb-4 max-w-2xl">
                كل مهمة يعمل عليها عامل حالياً بالضبط، بغض النظر عن المرحلة (تصميم، قص، طباعة، حديد، تجميع، تركيب...) — تُحدَّث فور ضغط أي عامل على زر "بدء العمل".
            </p>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">المرحلة</th>
                            <th className="px-5 py-2">العامل</th>
                            <th className="px-5 py-2">المدة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instances.filter(instance => instance.order).map(instance => (
                            <tr key={instance.id} className="border-t border-cream-3">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/orders/${instance.order.id}`} className="text-primary font-bold hover:underline">
                                            {instance.order.order_number}
                                        </Link>
                                        <CopyButton text={instance.order.order_number} />
                                    </div>
                                </td>
                                <td className="px-5 py-3 font-bold text-ink">{instance.order.customer_name}</td>
                                <td className="px-5 py-3">
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                                        {instance.stage_definition?.name_ar}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-muted">{instance.assigned_user?.name ?? '—'}</td>
                                <td className="px-5 py-3 text-muted">{instance.elapsed_hours} ساعة</td>
                            </tr>
                        ))}
                        {instances.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا توجد مهام قيد التنفيذ حالياً</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
