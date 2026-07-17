import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkerLayout from '@/Layouts/WorkerLayout';

const MAX_IMAGES = 10;

export default function Edit({ order, specFields }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
    const Layout = isAdmin ? AdminLayout : WorkerLayout;

    const initialSpecs = Object.fromEntries(order.spec_values.map(sv => [sv.spec_field_id, sv.value]));

    const { data, setData, post, transform, processing, errors } = useForm({
        customer_address: order.customer_address ?? '',
        notes: order.notes ?? '',
        due_date: order.due_date ?? '',
        specs: initialSpecs,
        images: [],
        delete_image_ids: [],
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState(order.images ?? []);

    function setSpec(fieldId, value) {
        setData('specs', { ...data.specs, [fieldId]: value });
    }

    function addImages(fileList) {
        const room = MAX_IMAGES - existingImages.length - data.images.length;
        const files = Array.from(fileList).slice(0, Math.max(0, room));
        setData('images', [...data.images, ...files]);
        setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }

    function removeNewImage(index) {
        setData('images', data.images.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }

    function removeExistingImage(id) {
        setExistingImages(prev => prev.filter(img => img.id !== id));
        setData('delete_image_ids', [...data.delete_image_ids, id]);
    }

    transform(formData => ({ ...formData, _method: 'put' }));

    function submit(e) {
        e.preventDefault();
        post(`/orders/${order.id}`, { forceFormData: true });
    }

    return (
        <Layout title={`تعديل الطلبية ${order.order_number}`}>
            <Head title={`تعديل ${order.order_number}`} />

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <div className="bg-white rounded-2xl border border-cream-3 p-5 space-y-4">
                    <p className="font-bold text-ink text-sm">بيانات العميل</p>
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">العنوان</label>
                        <input value={data.customer_address} onChange={e => setData('customer_address', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                        {errors.customer_address && <p className="text-red-500 text-xs mt-1">{errors.customer_address}</p>}
                    </div>
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
                    <p className="font-bold text-ink text-sm mb-3">
                        صور توضيحية ({existingImages.length + data.images.length}/{MAX_IMAGES})
                    </p>
                    <div className="flex flex-wrap gap-3 mb-3">
                        {existingImages.map(img => (
                            <div key={img.id} className="relative w-20 h-20">
                                <img src={img.url} className="w-20 h-20 object-cover rounded-xl border border-cream-3" />
                                <button type="button" onClick={() => removeExistingImage(img.id)}
                                    className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    ✕
                                </button>
                            </div>
                        ))}
                        {imagePreviews.map((src, i) => (
                            <div key={`new-${i}`} className="relative w-20 h-20">
                                <img src={src} className="w-20 h-20 object-cover rounded-xl border border-cream-3" />
                                <button type="button" onClick={() => removeNewImage(i)}
                                    className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    {existingImages.length + data.images.length < MAX_IMAGES && (
                        <label className="inline-block bg-cream px-4 py-2 rounded-xl border-2 border-dashed border-cream-3 text-sm text-muted cursor-pointer hover:border-primary">
                            + إضافة صور
                            <input type="file" accept="image/*" multiple className="hidden"
                                onChange={e => { addImages(e.target.files); e.target.value = ''; }} />
                        </label>
                    )}
                    {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                </div>

                <button disabled={processing} className="bg-ink text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-primary transition-colors">
                    {processing ? '⏳ جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
            </form>
        </Layout>
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
