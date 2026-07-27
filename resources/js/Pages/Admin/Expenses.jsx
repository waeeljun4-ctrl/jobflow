import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

const today = () => new Date().toISOString().slice(0, 10);

export default function Expenses({ expenses, byAdmin, filters, categories, todayTotal, weekTotal, monthTotal }) {
    const { confirmAction, dialog } = useConfirm();
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        description: '',
        category: '',
        spent_on: today(),
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/expenses', { onSuccess: () => reset('amount', 'description', 'category') });
    }

    function destroy(expense) {
        confirmAction(`حذف مصروف "${expense.description}" بقيمة ${expense.amount}₪؟`,
            (cb) => router.delete(`/admin/expenses/${expense.id}`, cb));
    }

    function applyFilters(e) {
        e.preventDefault();
        router.get('/admin/expenses', { from, to }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setFrom('');
        setTo('');
        router.get('/admin/expenses');
    }

    const printParams = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v)
    ).toString();
    const printHref = `/admin/expenses/print${printParams ? `?${printParams}` : ''}`;

    return (
        <AdminLayout title="💰 المصاريف">
            <Head title="المصاريف" />
            {dialog}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <SummaryCard label="مصروف اليوم" value={todayTotal} />
                <SummaryCard label="مصروف هالأسبوع" value={weekTotal} />
                <SummaryCard label="مصروف هالشهر" value={monthTotal} />
            </div>

            {byAdmin.length > 1 && (
                <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6">
                    <p className="font-bold text-ink text-sm mb-3">المصروف حسب المدير (للفترة المعروضة تحت)</p>
                    <div className="flex flex-wrap gap-3">
                        {byAdmin.map(a => (
                            <div key={a.name} className="bg-cream-2 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <span className="text-sm text-ink font-bold">{a.name}</span>
                                <span className="text-sm text-primary font-black">{a.total}₪</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">المبلغ (₪)</label>
                    <input type="number" step="0.01" min="0" value={data.amount} onChange={e => setData('amount', e.target.value)}
                        placeholder="0.00"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-28" />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-bold text-muted block mb-1">الوصف</label>
                    <input value={data.description} onChange={e => setData('description', e.target.value)}
                        placeholder="مثلاً: بنزين، غراء، أدوات..."
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-full" />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">التصنيف</label>
                    <select value={data.category} onChange={e => setData('category', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none">
                        <option value="">— اختر —</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">التاريخ</label>
                    <input type="date" value={data.spent_on} onChange={e => setData('spent_on', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                </div>
                <button disabled={processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + تسجيل مصروف
                </button>
            </form>

            <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 mb-4">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">من تاريخ</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">إلى تاريخ</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm" />
                </div>
                <button className="bg-cream-2 border border-cream-3 text-ink px-4 py-2 rounded-xl text-xs font-bold hover:bg-cream-3 transition-colors">
                    فلترة
                </button>
                {(filters.from || filters.to) && (
                    <button type="button" onClick={clearFilters} className="text-muted text-xs hover:underline">
                        إلغاء الفلاتر ✕
                    </button>
                )}
                <a href={printHref} target="_blank" rel="noreferrer" className="text-xs text-muted hover:underline mr-auto">
                    🖨️ طباعة الكشف
                </a>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">التاريخ</th>
                            <th className="px-5 py-2">الوصف</th>
                            <th className="px-5 py-2">التصنيف</th>
                            <th className="px-5 py-2">المبلغ</th>
                            <th className="px-5 py-2">سجّله</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">لا توجد مصاريف مسجلة</td></tr>
                        )}
                        {expenses.map(expense => (
                            <tr key={expense.id} className="border-t border-cream-3">
                                <td className="px-5 py-3 text-muted">{expense.spent_on.slice(0, 10)}</td>
                                <td className="px-5 py-3 font-bold text-ink">{expense.description}</td>
                                <td className="px-5 py-3 text-muted">{expense.category ?? '—'}</td>
                                <td className="px-5 py-3 font-bold text-ink">{expense.amount}₪</td>
                                <td className="px-5 py-3 text-muted">{expense.creator?.name ?? '—'}</td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => destroy(expense)} className="text-red-500 hover:underline text-xs">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-cream-3 p-5">
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className="text-2xl font-black text-ink">{value}₪</p>
        </div>
    );
}
