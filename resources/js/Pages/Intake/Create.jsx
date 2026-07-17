import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuoteItemsBuilder, { emptyQuoteItem, quoteItemsGrandTotal } from '@/Components/QuoteItemsBuilder';

const MAX_IMAGES = 10;

export default function Create({ conditionalStages, specFields }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        notes: '',
        due_date: '',
        stage_definition_ids: [],
        specs: {},
        price: '',
        deposit_amount: '',
        deposit_payment_method: '',
        images: [],
        has_quote: false,
        quote_items: [emptyQuoteItem()],
        send_to_design: true,
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const quoteTotal = quoteItemsGrandTotal(data.quote_items);

    function toggleStage(id) {
        setData('stage_definition_ids', data.stage_definition_ids.includes(id)
            ? data.stage_definition_ids.filter(w => w !== id)
            : [...data.stage_definition_ids, id]);
    }

    function setSpec(fieldId, value) {
        setData('specs', { ...data.specs, [fieldId]: value });
    }

    // Mirrors the width/height typed into the quote's first area
    // measurement into the matching spec fields, so the admin doesn't
    // re-type the same dimensions twice for the same order.
    function updateQuoteItems(items) {
        const patch = { ...data, quote_items: items };

        const firstArea = items.flatMap(item => item.measurements).find(m => m.type === 'area' && m.length_cm && m.width_cm);
        if (firstArea) {
            const widthField = specFields.find(f => f.label_ar?.includes('عرض'));
            const heightField = specFields.find(f => f.label_ar?.includes('ارتفاع'));
            const specs = { ...data.specs };
            if (widthField) specs[widthField.id] = firstArea.length_cm;
            if (heightField) specs[heightField.id] = firstArea.width_cm;
            patch.specs = specs;
        }

        setData(patch);
    }

    function addImages(fileList) {
        const files = Array.from(fileList).slice(0, MAX_IMAGES - data.images.length);
        setData('images', [...data.images, ...files]);
        setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }

    function removeImage(index) {
        setData('images', data.images.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }

    transform(formData => ({
        ...formData,
        quote_items: formData.has_quote ? formData.quote_items : null,
        send_to_design: formData.has_quote ? formData.send_to_design : true,
    }));

    function submit(e) {
        e.preventDefault();
        post('/intake', { forceFormData: true });
    }

    return (
        <AdminLayout title="استلام طلبية جديدة">
            <Head title="استلام طلبية" />

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <div className="bg-white rounded-2xl border border-cream-3 p-5 space-y-4">
                    <p className="font-bold text-ink text-sm">بيانات العميل</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField label="اسم العميل" value={data.customer_name} onChange={v => setData('customer_name', v)} error={errors.customer_name} />
                        <TextField label="رقم الهاتف" value={data.customer_phone} onChange={v => setData('customer_phone', v)} error={errors.customer_phone} />
                    </div>
                    <TextField label="العنوان" value={data.customer_address} onChange={v => setData('customer_address', v)} error={errors.customer_address} />
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">تاريخ التسليم المطلوب</label>
                        <input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">ملاحظات</label>
                        <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={3}
                            className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5 space-y-4">
                    <p className="font-bold text-ink text-sm">السعر والدفع <span className="text-muted font-normal text-xs">(للإدارة فقط)</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">السعر الكلي (₪)</label>
                            <input type="number" step="0.01" min="0" value={data.price} onChange={e => setData('price', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">مبلغ العربون (₪)</label>
                            <input type="number" step="0.01" min="0" value={data.deposit_amount} onChange={e => setData('deposit_amount', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                            {errors.deposit_amount && <p className="text-red-500 text-xs mt-1">{errors.deposit_amount}</p>}
                        </div>
                    </div>
                    {Number(data.deposit_amount) > 0 && (
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">طريقة دفع العربون</label>
                            <select value={data.deposit_payment_method} onChange={e => setData('deposit_payment_method', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none">
                                <option value="">— اختر —</option>
                                <option value="cash">نقدي</option>
                                <option value="bank_transfer">تحويل بنكي</option>
                                <option value="check">شيك</option>
                            </select>
                            {errors.deposit_payment_method && <p className="text-red-500 text-xs mt-1">{errors.deposit_payment_method}</p>}
                        </div>
                    )}
                    {Number(data.price) > 0 && (
                        <p className="text-xs text-muted">
                            المتبقي: <span className="font-bold text-ink">{(Number(data.price) - Number(data.deposit_amount || 0)).toFixed(2)} ₪</span>
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5 space-y-4">
                    <p className="font-bold text-ink text-sm">عرض السعر</p>
                    <div className="flex gap-3">
                        <label className={`flex-1 text-center cursor-pointer px-3 py-2 rounded-xl border-2 font-bold text-sm ${!data.has_quote ? 'border-primary bg-primary-pale text-primary' : 'border-cream-3 text-muted'}`}>
                            <input type="radio" className="hidden" checked={!data.has_quote}
                                onChange={() => setData({ ...data, has_quote: false, send_to_design: true })} />
                            بدون عرض سعر — تُرسل للتصميم مباشرة
                        </label>
                        <label className={`flex-1 text-center cursor-pointer px-3 py-2 rounded-xl border-2 font-bold text-sm ${data.has_quote ? 'border-primary bg-primary-pale text-primary' : 'border-cream-3 text-muted'}`}>
                            <input type="radio" className="hidden" checked={data.has_quote}
                                onChange={() => setData('has_quote', true)} />
                            مع عرض سعر
                        </label>
                    </div>

                    {data.has_quote && (
                        <div className="space-y-4">
                            <QuoteItemsBuilder items={data.quote_items} onChange={updateQuoteItems} errors={errors} />

                            <div className="flex items-center justify-between bg-cream-2 rounded-xl px-4 py-3">
                                <p className="text-sm font-bold text-ink">مجموع عرض السعر</p>
                                <p className="text-lg font-black text-primary">{quoteTotal}</p>
                            </div>

                            <div className="flex gap-3">
                                <label className={`flex-1 text-center cursor-pointer px-3 py-2 rounded-xl border-2 font-bold text-sm ${data.send_to_design ? 'border-primary bg-primary-pale text-primary' : 'border-cream-3 text-muted'}`}>
                                    <input type="radio" className="hidden" checked={data.send_to_design}
                                        onChange={() => setData('send_to_design', true)} />
                                    إرسالها للتصميم مباشرة
                                </label>
                                <label className={`flex-1 text-center cursor-pointer px-3 py-2 rounded-xl border-2 font-bold text-sm ${!data.send_to_design ? 'border-primary bg-primary-pale text-primary' : 'border-cream-3 text-muted'}`}>
                                    <input type="radio" className="hidden" checked={!data.send_to_design}
                                        onChange={() => setData('send_to_design', false)} />
                                    إبقاؤها بانتظار حتى يوافق الزبون
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5">
                    <p className="font-bold text-ink text-sm mb-3">نوع العمل المطلوب</p>
                    {errors.stage_definition_ids && <p className="text-red-500 text-xs mb-2">{errors.stage_definition_ids}</p>}
                    <div className="flex flex-wrap gap-3">
                        {conditionalStages.map(stage => (
                            <label key={stage.id} className="flex items-center gap-2 cursor-pointer bg-cream px-3 py-2 rounded-xl border-2 border-cream-3 has-[:checked]:border-primary">
                                <input type="checkbox" checked={data.stage_definition_ids.includes(stage.id)}
                                    onChange={() => toggleStage(stage.id)} className="accent-primary w-4 h-4" />
                                <span className="text-sm text-ink">{stage.name_ar}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5">
                    <p className="font-bold text-ink text-sm mb-3">مواصفات القرمة</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specFields.map(field => (
                            <SpecInput key={field.id} field={field} value={data.specs[field.id] ?? ''}
                                onChange={v => setSpec(field.id, v)} error={errors[`specs.${field.id}`]} />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-cream-3 p-5">
                    <p className="font-bold text-ink text-sm mb-3">صور توضيحية ({data.images.length}/{MAX_IMAGES})</p>
                    <div className="flex flex-wrap gap-3 mb-3">
                        {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-20 h-20">
                                <img src={src} className="w-20 h-20 object-cover rounded-xl border border-cream-3" />
                                <button type="button" onClick={() => removeImage(i)}
                                    className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    {data.images.length < MAX_IMAGES && (
                        <label className="inline-block bg-cream px-4 py-2 rounded-xl border-2 border-dashed border-cream-3 text-sm text-muted cursor-pointer hover:border-primary">
                            + إضافة صور
                            <input type="file" accept="image/*" multiple className="hidden"
                                onChange={e => { addImages(e.target.files); e.target.value = ''; }} />
                        </label>
                    )}
                    {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                </div>

                <button disabled={processing} className="bg-ink text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-primary transition-colors">
                    {processing ? '⏳ جاري الحفظ...' : 'حفظ الطلبية'}
                </button>
            </form>
        </AdminLayout>
    );
}

function TextField({ label, value, onChange, error }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function SpecInput({ field, value, onChange, error }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">
                {field.label_ar} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            {field.field_type === 'select' ? (
                <select value={value} onChange={e => onChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none">
                    <option value="">— اختر —</option>
                    {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : field.field_type === 'textarea' ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            ) : field.field_type === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={value === true || value === '1'} onChange={e => onChange(e.target.checked)}
                        className="accent-primary w-4 h-4" />
                    <span className="text-sm text-muted">نعم</span>
                </label>
            ) : (
                <input type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                    value={value} onChange={e => onChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
