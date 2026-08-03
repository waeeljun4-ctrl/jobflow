import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import CopyButton from '@/Components/CopyButton';
import { useConfirm } from '@/Components/useConfirm';

export default function Paused({ instances }) {
    const { confirmAction, dialog } = useConfirm();

    function resume(instance) {
        confirmAction(`تأكيد استئناف العمل على طلبية ${instance.order?.order_number}؟`,
            (cb) => router.post(`/admin/paused/${instance.id}/resume`, {}, cb));
    }

    return (
        <AdminLayout title="متوقف مؤقتاً">
            <Head title="متوقف مؤقتاً" />
            {dialog}

            <p className="text-sm text-muted mb-4 max-w-2xl">
                الطلبيات يلي عامل أوقفها مؤقتاً بسبب نقص مادة أو مشكلة تانية — تحتاج حل من الإدارة قبل ما يقدر العامل يكمل.
            </p>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">المرحلة</th>
                            <th className="px-5 py-2">العامل</th>
                            <th className="px-5 py-2">السبب</th>
                            <th className="px-5 py-2">متوقفة منذ</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {instances.filter(instance => instance.order).map(instance => {
                            const pause = instance.pauses?.[0];
                            return (
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
                                    <td className="px-5 py-3 text-ink">{pause?.reason ?? '—'}</td>
                                    <td className="px-5 py-3 text-muted">
                                        {pause?.paused_at ? new Date(pause.paused_at).toLocaleString('ar-PS') : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-left">
                                        <button onClick={() => resume(instance)}
                                            className="bg-stage-done text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-colors">
                                            ▶️ استئناف
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {instances.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-6 text-center text-muted">لا توجد طلبيات متوقفة مؤقتاً</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
