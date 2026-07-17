import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CustomerShow({ customer }) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        address: customer.address ?? '',
        notes: customer.notes ?? '',
    });

    function submit(e) {
        e.preventDefault();
        put(`/admin/customers/${customer.id}`);
    }

    return (
        <AdminLayout title={customer.name}>
            <Head title={customer.name} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
                <div className="lg:col-span-1">
                    <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 space-y-4">
                        <p className="font-bold text-ink text-sm">بيانات الزبون</p>
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">الاسم</label>
                            <input value={data.name} onChange={e => setData('name', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">الهاتف</label>
                            <p dir="ltr" className="text-sm text-ink font-bold px-3 py-2 bg-cream rounded-xl">{customer.phone}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">العنوان</label>
                            <textarea value={data.address} onChange={e => setData('address', e.target.value)} rows={3}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">ملاحظات</label>
                            <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                        </div>
                        <button disabled={processing}
                            className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                            حفظ
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                        <div className="px-5 py-3 border-b border-cream-3 font-bold text-ink text-sm">
                            سجل الطلبيات ({customer.orders.length})
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-right text-muted text-xs uppercase">
                                    <th className="px-5 py-2">رقم الطلبية</th>
                                    <th className="px-5 py-2">أنواع العمل</th>
                                    <th className="px-5 py-2">الحالة</th>
                                    <th className="px-5 py-2">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer.orders.map(order => (
                                    <tr key={order.id} className="border-t border-cream-3">
                                        <td className="px-5 py-3">
                                            <Link href={`/orders/${order.id}`} className="text-primary font-bold hover:underline">
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 text-muted">
                                            {order.stage_definitions.map(s => s.name_ar).join('، ')}
                                        </td>
                                        <td className="px-5 py-3">{order.status_label}</td>
                                        <td className="px-5 py-3 text-muted text-xs">{order.created_at?.slice(0, 10)}</td>
                                    </tr>
                                ))}
                                {customer.orders.length === 0 && (
                                    <tr><td colSpan={4} className="px-5 py-6 text-center text-muted">لا يوجد طلبيات بعد</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
