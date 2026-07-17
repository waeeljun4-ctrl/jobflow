import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuoteItemsBuilder, { emptyQuoteItem, quoteItemsGrandTotal } from '@/Components/QuoteItemsBuilder';

export default function QuoteForm({ quote }) {
    const isEdit = !!quote;

    const { data, setData, post, put, processing, errors } = useForm({
        customer_name: quote?.customer_name ?? '',
        customer_phone: quote?.customer_phone ?? '',
        quote_date: quote?.quote_date ?? new Date().toISOString().slice(0, 10),
        valid_until: quote?.valid_until ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        notes: quote?.notes ?? '',
        items: quote?.items?.length
            ? quote.items.map(i => ({
                description: i.description,
                unit_price: i.unit_price,
                quantity: i.quantity,
                notes: i.notes ?? '',
                measurements: i.measurements.map(m => ({ type: m.type ?? 'area', length_cm: m.length_cm, width_cm: m.width_cm, pieces: m.pieces })),
            }))
            : [emptyQuoteItem()],
    });

    const grandTotal = quoteItemsGrandTotal(data.items);

    // QuoteItemsBuilder's errors prop expects "quote_items.N.field" keys —
    // this form validates under "items.N.field" instead, so remap them.
    const builderErrors = Object.fromEntries(
        Object.entries(errors).map(([key, value]) => [key.replace(/^items\./, 'quote_items.'), value])
    );

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/quotes/${quote.id}`);
        } else {
            post('/admin/quotes');
        }
    }

    return (
        <AdminLayout title={isEdit ? 'تعديل عرض السعر' : 'عرض سعر جديد'}>
            <Head title={isEdit ? 'تعديل عرض السعر' : 'عرض سعر جديد'} />

            <form onSubmit={submit}>
                <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="اسم الزبون" value={data.customer_name} onChange={v => setData('customer_name', v)} error={errors.customer_name} />
                    <Field label="رقم الهاتف" value={data.customer_phone} onChange={v => setData('customer_phone', v)} error={errors.customer_phone} />
                    <Field label="تاريخ العرض" type="date" value={data.quote_date} onChange={v => setData('quote_date', v)} error={errors.quote_date} />
                    <Field label="صالح لغاية" type="date" value={data.valid_until} onChange={v => setData('valid_until', v)} error={errors.valid_until} />
                </div>

                <div className="mb-6">
                    <QuoteItemsBuilder items={data.items} onChange={v => setData('items', v)} errors={builderErrors} />
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6">
                    <label className="text-xs font-bold text-muted block mb-1">ملاحظات عامة على العرض</label>
                    <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2}
                        className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex items-center justify-between">
                    <p className="font-bold text-ink">المجموع الكلي</p>
                    <p className="text-2xl font-black text-primary">{grandTotal}</p>
                </div>

                <button disabled={processing} className="bg-ink text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    {isEdit ? 'حفظ التعديل' : 'حفظ عرض السعر'}
                </button>
            </form>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
