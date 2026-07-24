import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function OrdersTrash({ orders }) {
    const { confirmAction, dialog } = useConfirm();

    function restore(order) {
        confirmAction(`استرجاع الطلبية ${order.order_number}؟`,
            (cb) => router.post(`/admin/orders/${order.id}/restore`, {}, cb));
    }

    return (
        <AdminLayout title="سلة المحذوفات">
            <Head title="سلة المحذوفات" />
            {dialog}

            <div className="mb-4">
                <Link href="/admin/orders" className="text-xs text-muted hover:underline">→ العودة لكل الطلبيات</Link>
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">أنواع العمل</th>
                            <th className="px-5 py-2">تاريخ الحذف</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.map(order => (
                            <tr key={order.id} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{order.order_number}</td>
                                <td className="px-5 py-3 font-bold text-ink">{order.customer_name}</td>
                                <td className="px-5 py-3 text-muted">
                                    {order.stage_definitions.map(s => s.name_ar).join('، ')}
                                </td>
                                <td className="px-5 py-3 text-muted">{order.deleted_at}</td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => restore(order)}
                                        className="bg-primary-pale text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                                        ↩ استرجاع
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.data.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">سلة المحذوفات فارغة</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
