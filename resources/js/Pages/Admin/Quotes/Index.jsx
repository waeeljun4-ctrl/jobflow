import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function QuotesIndex({ quotes }) {
    const { confirmAction, dialog } = useConfirm();

    function destroy(id) {
        confirmAction('حذف عرض السعر هذا؟', (cb) => router.delete(`/admin/quotes/${id}`, cb));
    }

    return (
        <AdminLayout title="عروض الأسعار">
            <Head title="عروض الأسعار" />
            {dialog}

            <div className="mb-4 flex justify-end">
                <Link href="/admin/quotes/create" className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + عرض سعر جديد
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم العرض</th>
                            <th className="px-5 py-2">الزبون</th>
                            <th className="px-5 py-2">التاريخ</th>
                            <th className="px-5 py-2">صالح لغاية</th>
                            <th className="px-5 py-2">المجموع</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map(q => (
                            <tr key={q.id} className="border-t border-cream-3">
                                <td className="px-5 py-3">
                                    <Link href={`/admin/quotes/${q.id}`} className="text-primary font-bold hover:underline">
                                        {q.quote_number}
                                    </Link>
                                </td>
                                <td className="px-5 py-3">{q.customer_name}</td>
                                <td className="px-5 py-3 text-muted">{q.quote_date}</td>
                                <td className="px-5 py-3 text-muted">{q.valid_until || '—'}</td>
                                <td className="px-5 py-3 font-bold text-ink">{q.total}</td>
                                <td className="px-5 py-3 text-left whitespace-nowrap">
                                    <a href={`/admin/quotes/${q.id}/print`} target="_blank" rel="noreferrer"
                                        className="text-ink hover:underline text-xs font-bold ml-3">
                                        🖨️ طباعة
                                    </a>
                                    <button onClick={() => destroy(q.id)} className="text-red-500 hover:underline text-xs font-bold">
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {quotes.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">لا يوجد عروض أسعار بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
