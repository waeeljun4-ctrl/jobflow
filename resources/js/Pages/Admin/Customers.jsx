import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function Customers({ customers, search }) {
    const [query, setQuery] = useState(search ?? '');
    const { confirmAction, dialog } = useConfirm();

    function submitSearch(e) {
        e.preventDefault();
        router.get('/admin/customers', { search: query }, { preserveState: true });
    }

    function destroy(e, customer) {
        e.stopPropagation();
        confirmAction(`حذف الزبون "${customer.name}"؟ الطلبيات القديمة بتضل موجودة، بس رح تنفصل عن هالزبون.`,
            (cb) => router.delete(`/admin/customers/${customer.id}`, cb));
    }

    return (
        <AdminLayout title="الزبائن">
            <Head title="الزبائن" />
            {dialog}

            <form onSubmit={submitSearch} className="mb-6 flex gap-3">
                <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="بحث بالاسم أو الهاتف أو العنوان..."
                    className="flex-1 max-w-sm px-4 py-2.5 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                <button className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    بحث
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الاسم</th>
                            <th className="px-5 py-2">الهاتف</th>
                            <th className="px-5 py-2">العنوان</th>
                            <th className="px-5 py-2">عدد الطلبيات</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.data.map(c => (
                            <tr key={c.id} className="border-t border-cream-3 hover:bg-cream cursor-pointer"
                                onClick={() => router.visit(`/admin/customers/${c.id}`)}>
                                <td className="px-5 py-3 font-bold text-ink">{c.name}</td>
                                <td className="px-5 py-3 text-muted" dir="ltr">{c.phone}</td>
                                <td className="px-5 py-3 text-muted">{c.address || '—'}</td>
                                <td className="px-5 py-3">
                                    <span className="px-2.5 py-1 rounded-lg bg-primary-pale text-primary text-xs font-bold">
                                        {c.orders_count}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={e => destroy(e, c)} className="text-red-500 hover:text-red-700 text-xs font-bold">
                                        🗑️ حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {customers.data.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا يوجد زبائن بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {customers.links?.length > 3 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {customers.links.map((link, i) => (
                        <Link key={i} href={link.url || '#'} preserveState
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${link.active ? 'bg-primary text-white' : 'bg-white text-muted border border-cream-3'} ${!link.url && 'opacity-40 pointer-events-none'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
