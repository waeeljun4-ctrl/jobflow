import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Orders({ orders, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    function destroy(order) {
        if (! confirm(`نقل الطلبية ${order.order_number} لسلة المحذوفات؟ تقدر تسترجعها لاحقاً من سلة المحذوفات.`)) return;
        router.delete(`/admin/orders/${order.id}`);
    }

    function applyFilters(e) {
        e.preventDefault();
        router.get('/admin/orders', { status: filters.status, search, from, to }, { preserveState: true, replace: true });
    }

    function setStatus(status) {
        router.get('/admin/orders', { status, search, from, to }, { preserveState: true, replace: true });
    }

    function clearAll() {
        setSearch('');
        setFrom('');
        setTo('');
        router.get('/admin/orders');
    }

    const hasFilters = filters.status || filters.search || filters.from || filters.to;

    const printParams = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v)
    ).toString();
    const printHref = `/admin/orders/print${printParams ? `?${printParams}` : ''}`;

    return (
        <AdminLayout title="الطلبيات">
            <Head title="الطلبيات" />

            <div className="mb-4 flex items-center gap-2 flex-wrap">
                <StatusTab label="الكل" active={!filters.status} onClick={() => setStatus('')} />
                <StatusTab label="قيد التنفيذ" active={filters.status === 'in_progress'} onClick={() => setStatus('in_progress')} />
                <StatusTab label="مكتملة" active={filters.status === 'completed'} onClick={() => setStatus('completed')} />
            </div>

            <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
                <form onSubmit={applyFilters} className="flex items-center gap-2 flex-wrap">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث: اسم العميل، رقم الطلبية، الهاتف"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-64" />
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    <span className="text-muted text-xs">إلى</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    <button className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-colors">
                        فلترة
                    </button>
                    {hasFilters && (
                        <button type="button" onClick={clearAll} className="text-xs text-muted hover:underline">
                            إلغاء الفلاتر ✕
                        </button>
                    )}
                </form>
                <div className="flex items-center gap-3">
                    <a href={printHref} target="_blank" rel="noreferrer" className="text-xs text-muted hover:underline">
                        🖨️ طباعة الكشف ({orders.total} طلبية)
                    </a>
                    <Link href="/admin/orders/trash" className="text-xs text-muted hover:underline">🗑️ سلة المحذوفات</Link>
                    <Link href="/intake" className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                        + طلبية جديدة
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">أنواع العمل</th>
                            <th className="px-5 py-2">الحالة</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.map(order => (
                            <tr key={order.id} className="border-t border-cream-3">
                                <td className="px-5 py-3">
                                    <Link href={`/orders/${order.id}`} className="text-primary font-bold hover:underline">
                                        {order.order_number}
                                    </Link>
                                </td>
                                <td className="px-5 py-3 font-bold text-ink">{order.customer_name}</td>
                                <td className="px-5 py-3 text-muted">
                                    {order.stage_definitions.map(s => s.name_ar).join('، ')}
                                </td>
                                <td className="px-5 py-3">{order.status_label}</td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => destroy(order)}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold">
                                        🗑️ حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.data.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا يوجد طلبيات مطابقة</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={orders.links} />
        </AdminLayout>
    );
}

function StatusTab({ label, active, onClick }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${active ? 'bg-ink text-white' : 'bg-white border border-cream-3 text-muted hover:bg-cream-2'}`}>
            {label}
        </button>
    );
}

function Pagination({ links }) {
    if (! links || links.length <= 3) return null;
    return (
        <div className="flex items-center justify-center gap-1 flex-wrap">
            {links.map((link, i) => (
                link.url ? (
                    <Link key={i} href={link.url} preserveScroll
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${link.active ? 'bg-ink text-white' : 'bg-white border border-cream-3 text-ink hover:bg-cream-2'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ) : (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted/50"
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                )
            ))}
        </div>
    );
}
