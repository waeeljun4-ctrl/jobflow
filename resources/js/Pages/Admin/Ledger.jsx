import { Fragment, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function Ledger({ workers, suppliers }) {
    const { confirmAction, dialog } = useConfirm();
    const [openParty, setOpenParty] = useState(null); // "worker-3" | "supplier-1"

    const supplierForm = useForm({ name: '', phone: '' });

    function addSupplier(e) {
        e.preventDefault();
        supplierForm.post('/admin/ledger/suppliers', { onSuccess: () => supplierForm.reset() });
    }

    function toggle(type, id) {
        const key = `${type}-${id}`;
        setOpenParty(openParty === key ? null : key);
    }

    function deleteEntry(entry) {
        confirmAction(`حذف حركة "${entry.description}" بقيمة ${Math.abs(entry.amount)}₪؟`,
            (cb) => router.delete(`/admin/ledger/entries/${entry.id}`, cb));
    }

    return (
        <AdminLayout title="📒 دفتر الحسابات">
            <Head title="دفتر الحسابات" />
            {dialog}

            <div className="flex justify-end gap-4 mb-3">
                <a href="/admin/ledger/print/workers" target="_blank" rel="noreferrer" className="text-xs text-muted hover:underline">
                    🖨️ طباعة كشف العمال
                </a>
                <a href="/admin/ledger/print/suppliers" target="_blank" rel="noreferrer" className="text-xs text-muted hover:underline">
                    🖨️ طباعة كشف التجار
                </a>
            </div>

            <form onSubmit={addSupplier} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">اسم التاجر</label>
                    <input value={supplierForm.data.name} onChange={e => supplierForm.setData('name', e.target.value)}
                        placeholder="مثلاً: معرض الألمنيوم"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-56" />
                    {supplierForm.errors.name && <p className="text-red-500 text-xs mt-1">{supplierForm.errors.name}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الهاتف (اختياري)</label>
                    <input value={supplierForm.data.phone} onChange={e => supplierForm.setData('phone', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-40" />
                </div>
                <button disabled={supplierForm.processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + إضافة تاجر
                </button>
            </form>

            <PartySection title="العمال" parties={workers} openParty={openParty} onToggle={toggle} onDeleteEntry={deleteEntry} />
            <div className="mt-6" />
            <PartySection title="التجار" parties={suppliers} openParty={openParty} onToggle={toggle} onDeleteEntry={deleteEntry} emptyText="لا يوجد تجار مسجلين بعد" />
        </AdminLayout>
    );
}

function PartySection({ title, parties, openParty, onToggle, onDeleteEntry, emptyText }) {
    const total = parties.reduce((sum, p) => sum + Number(p.balance), 0);

    return (
        <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-cream-3">
                <p className="font-bold text-ink text-sm">{title}</p>
                {parties.length > 0 && (
                    <div className="text-xs">
                        <span className="text-muted ml-1.5">الإجمالي:</span>
                        <Balance amount={total} />
                    </div>
                )}
            </div>
            <table className="w-full text-sm">
                <tbody>
                    {parties.length === 0 && (
                        <tr><td className="px-5 py-6 text-center text-muted">{emptyText ?? 'لا يوجد عمال'}</td></tr>
                    )}
                    {parties.map(party => {
                        const key = `${party.type}-${party.id}`;
                        const isOpen = openParty === key;
                        return (
                            <Fragment key={key}>
                                <tr className="border-t border-cream-3 cursor-pointer hover:bg-cream-2/50" onClick={() => onToggle(party.type, party.id)}>
                                    <td className="px-5 py-3 font-bold text-ink">
                                        {party.name}
                                        {party.phone && <span className="text-muted font-normal text-xs mr-2" dir="ltr">{party.phone}</span>}
                                    </td>
                                    <td className="px-5 py-3 text-left">
                                        <Balance amount={party.balance} />
                                    </td>
                                    <td className="px-5 py-3 text-left w-8 text-muted">{isOpen ? '▲' : '▼'}</td>
                                </tr>
                                {isOpen && (
                                    <tr className="border-t border-cream-3 bg-cream-2/50">
                                        <td colSpan={3} className="px-5 py-4">
                                            <PartyDetail party={party} onDeleteEntry={onDeleteEntry} />
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function Balance({ amount }) {
    const n = Number(amount);
    if (n === 0) return <span className="text-muted text-xs font-bold">متوازن</span>;
    if (n > 0) return <span className="text-red-600 text-sm font-black">عليك له {n}₪</span>;
    return <span className="text-green-600 text-sm font-black">إلك عنده {Math.abs(n)}₪</span>;
}

function PartyDetail({ party, onDeleteEntry }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        party_type: party.type,
        party_id: party.id,
        amount: '',
        description: '',
        entry_date: new Date().toISOString().slice(0, 10),
    });

    // transform() (not post(url, { data })) is the only reliable way to
    // inject a value that isn't itself a bound form field — useForm's
    // post() ignores a data override passed via options.
    function submit(e, direction) {
        e.preventDefault();
        if (! data.amount || ! data.description) return;
        transform(formData => ({ ...formData, direction }));
        post('/admin/ledger/entries', {
            preserveScroll: true,
            onSuccess: () => reset('amount', 'description'),
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">المبلغ (₪)</label>
                    <input type="number" step="0.01" min="0" value={data.amount} onChange={e => setData('amount', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-28" />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-bold text-muted block mb-1">الوصف</label>
                    <input value={data.description} onChange={e => setData('description', e.target.value)}
                        placeholder="مثلاً: راتب تموز / بضاعة ألمنيوم"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-full" />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">التاريخ</label>
                    <input type="date" value={data.entry_date} onChange={e => setData('entry_date', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm" />
                </div>
                <button disabled={processing} onClick={e => submit(e, 'due')}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">
                    + تسجيل مستحق
                </button>
                <button disabled={processing} onClick={e => submit(e, 'payment')}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                    − تسجيل دفعة
                </button>
            </div>

            <div className="space-y-1.5">
                {party.entries.length === 0 && <p className="text-xs text-muted">لا توجد حركات مسجلة بعد</p>}
                {party.entries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-cream-2 text-ink font-bold px-2 py-1 rounded-md shrink-0">
                                📅 {entry.entry_date.slice(0, 10)}
                            </span>
                            <span className={`font-black ${entry.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {entry.amount > 0 ? '+' : '−'}{Math.abs(entry.amount)}₪
                            </span>
                            <span className="text-ink">{entry.description}</span>
                            <span className="text-muted">— {entry.creator?.name}</span>
                        </div>
                        <button onClick={() => onDeleteEntry(entry)} className="text-red-500 hover:underline shrink-0">حذف</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
