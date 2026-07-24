import { Fragment, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function Inventory({ items }) {
    const [adjustingId, setAdjustingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const { confirmAction, dialog } = useConfirm();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        unit: 'قطعة',
        quantity: '',
        low_stock_threshold: '',
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/inventory', { onSuccess: () => reset() });
    }

    function destroy(item) {
        confirmAction(`حذف الصنف "${item.name}"؟ سيُحذف معه سجل حركاته بالكامل.`,
            (cb) => router.delete(`/admin/inventory/${item.id}`, cb));
    }

    return (
        <AdminLayout title="📦 المخزن">
            <Head title="المخزن" />
            {dialog}

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">اسم الصنف</label>
                    <input value={data.name} onChange={e => setData('name', e.target.value)}
                        placeholder="لوح ألمنيوم 3 مم"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-56" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الوحدة</label>
                    <input value={data.unit} onChange={e => setData('unit', e.target.value)}
                        placeholder="قطعة / متر / لتر"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-28" />
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الكمية الحالية</label>
                    <input type="number" step="0.01" value={data.quantity} onChange={e => setData('quantity', e.target.value)}
                        placeholder="0"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-28" />
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">حد التنبيه (اختياري)</label>
                    <input type="number" step="0.01" value={data.low_stock_threshold} onChange={e => setData('low_stock_threshold', e.target.value)}
                        placeholder="مثلاً 5"
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-28" />
                </div>
                <button disabled={processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + إضافة صنف
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الصنف</th>
                            <th className="px-5 py-2">الكمية</th>
                            <th className="px-5 py-2">حد التنبيه</th>
                            <th className="px-5 py-2">الحالة</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">لا توجد أصناف بعد</td></tr>
                        )}
                        {items.map(item => (
                            <Fragment key={item.id}>
                                <tr className={`border-t border-cream-3 ${!item.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-5 py-3 font-bold text-ink">
                                        {item.name}
                                        {item.notes && <p className="text-xs text-muted font-normal mt-0.5">{item.notes}</p>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`font-bold ${item.is_low_stock ? 'text-red-600' : 'text-ink'}`}>
                                            {item.quantity} {item.unit}
                                        </span>
                                        {item.is_low_stock && (
                                            <span className="mr-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠ شارف على الانتهاء</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-muted">
                                        {item.low_stock_threshold !== null ? `${item.low_stock_threshold} ${item.unit}` : '—'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.is_active ? 'مفعّل' : 'معطّل'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-left whitespace-nowrap">
                                        <button onClick={() => { setAdjustingId(adjustingId === item.id ? null : item.id); setEditingId(null); }}
                                            className="text-primary hover:underline text-xs font-bold ml-3">
                                            تعديل الكمية
                                        </button>
                                        <button onClick={() => { setEditingId(editingId === item.id ? null : item.id); setAdjustingId(null); }}
                                            className="text-muted hover:underline text-xs font-bold ml-3">
                                            تعديل البيانات
                                        </button>
                                        <button onClick={() => destroy(item)} className="text-red-500 hover:underline text-xs">حذف</button>
                                    </td>
                                </tr>
                                {adjustingId === item.id && <AdjustRow item={item} onDone={() => setAdjustingId(null)} />}
                                {editingId === item.id && <EditRow item={item} onDone={() => setEditingId(null)} />}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdjustRow({ item, onDone }) {
    const { data, setData, post, processing, errors, reset } = useForm({ change: '', reason: '' });

    function submit(e, sign) {
        e.preventDefault();
        if (!data.change) return;
        post(`/admin/inventory/${item.id}/adjust`, {
            data: { change: sign * Math.abs(Number(data.change)), reason: data.reason },
            preserveScroll: true,
            onSuccess: () => { reset(); onDone(); },
        });
    }

    return (
        <tr className="border-t border-cream-3 bg-cream-2/50">
            <td colSpan={5} className="px-5 py-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">الكمية ({item.unit})</label>
                        <input type="number" step="0.01" min="0" value={data.change} onChange={e => setData('change', e.target.value)}
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-28" />
                        {errors.change && <p className="text-red-500 text-xs mt-1">{errors.change}</p>}
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs font-bold text-muted block mb-1">السبب (اختياري)</label>
                        <input value={data.reason} onChange={e => setData('reason', e.target.value)}
                            placeholder="مثلاً: استُخدم بطلبية JF-2026-07-0002"
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-full" />
                    </div>
                    <button disabled={processing} onClick={e => submit(e, 1)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                        + إضافة للمخزون
                    </button>
                    <button disabled={processing} onClick={e => submit(e, -1)}
                        className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors">
                        − سحب من المخزون
                    </button>
                    <button onClick={onDone} className="text-muted text-xs hover:underline">إلغاء</button>
                </div>
            </td>
        </tr>
    );
}

function EditRow({ item, onDone }) {
    const { data, setData, put, processing, errors } = useForm({
        name: item.name,
        unit: item.unit,
        low_stock_threshold: item.low_stock_threshold ?? '',
        notes: item.notes ?? '',
        is_active: item.is_active,
    });

    function submit(e) {
        e.preventDefault();
        put(`/admin/inventory/${item.id}`, { preserveScroll: true, onSuccess: onDone });
    }

    return (
        <tr className="border-t border-cream-3 bg-cream-2/50">
            <td colSpan={5} className="px-5 py-3">
                <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">اسم الصنف</label>
                        <input value={data.name} onChange={e => setData('name', e.target.value)}
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-48" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">الوحدة</label>
                        <input value={data.unit} onChange={e => setData('unit', e.target.value)}
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-24" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">حد التنبيه</label>
                        <input type="number" step="0.01" value={data.low_stock_threshold} onChange={e => setData('low_stock_threshold', e.target.value)}
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-24" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs font-bold text-muted block mb-1">ملاحظات</label>
                        <input value={data.notes} onChange={e => setData('notes', e.target.value)}
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm w-full" />
                    </div>
                    <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                            className="accent-primary w-4 h-4" />
                        <span className="text-sm text-muted">مفعّل</span>
                    </label>
                    <button disabled={processing} className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary transition-colors">
                        حفظ
                    </button>
                    <button type="button" onClick={onDone} className="text-muted text-xs hover:underline">إلغاء</button>
                </form>
            </td>
        </tr>
    );
}
