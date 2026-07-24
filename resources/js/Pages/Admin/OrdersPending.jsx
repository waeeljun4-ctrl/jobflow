import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function OrdersPending({ orders }) {
    const { confirmAction, dialog } = useConfirm();

    function release(order) {
        confirmAction(`إرسال الطلبية ${order.order_number} للتصميم؟`,
            (cb) => router.post(`/admin/orders/${order.id}/release`, {}, cb));
    }

    return (
        <AdminLayout title="بانتظار الموافقة على السعر">
            <Head title="بانتظار الموافقة" />
            {dialog}

            <p className="text-xs text-muted mb-4">هذه الطلبيات مسجّلة مع عرض سعر، وهي متوقفة إلى أن يوافق الزبون على السعر.</p>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">عرض السعر</th>
                            <th className="px-5 py-2">المجموع</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="border-t border-cream-3">
                                <td className="px-5 py-3">
                                    <Link href={`/orders/${order.id}`} className="text-primary font-bold hover:underline">
                                        {order.order_number}
                                    </Link>
                                </td>
                                <td className="px-5 py-3">{order.customer_name}</td>
                                <td className="px-5 py-3 text-muted">
                                    {order.quote ? (
                                        <a href={`/admin/quotes/${order.quote.id}/print`} target="_blank" rel="noreferrer" className="hover:underline">
                                            {order.quote.quote_number}
                                        </a>
                                    ) : '—'}
                                </td>
                                <td className="px-5 py-3 font-bold text-ink">{order.quote?.total ?? '—'}</td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => release(order)}
                                        className="bg-ink text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary transition-colors">
                                        ابدأ التصميم
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا يوجد طلبيات بانتظار الموافقة</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
