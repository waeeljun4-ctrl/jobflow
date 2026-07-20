import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkerLayout from '@/Layouts/WorkerLayout';

const MAX_IMAGES = 10;

const STAGE_STATUS_LABELS = {
    locked: 'بانتظار مرحلة سابقة',
    available: 'متاحة الآن',
    in_progress: 'قيد التنفيذ الآن',
    done: 'مكتملة',
};

export default function Edit({ order, specFields, stageOptions, stageInstances }) {
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

    const instanceByStage = Object.fromEntries((stageInstances ?? []).map(i => [i.stage_definition_id, i]));
    // The intake stage instance is always present but never a real
    // selection (auto-created, auto-completed) — it has no matching
    // stageOptions entry, so exclude it from the editable set entirely.
    const optionIds = new Set((stageOptions ?? []).map(s => s.id));
    const selectableInstances = (stageInstances ?? []).filter(i => optionIds.has(i.stage_definition_id));

    const stagesForm = useForm({
        stage_definition_ids: selectableInstances.map(i => i.stage_definition_id),
        stage_assignments: Object.fromEntries(selectableInstances.map(i => [i.stage_definition_id, i.assigned_to ?? ''])),
    });

    function toggleOrderStage(id) {
        const isLockedIn = ['in_progress', 'done'].includes(instanceByStage[id]?.status);
        if (isLockedIn) return;

        stagesForm.setData('stage_definition_ids', stagesForm.data.stage_definition_ids.includes(id)
            ? stagesForm.data.stage_definition_ids.filter(w => w !== id)
            : [...stagesForm.data.stage_definition_ids, id]);
    }

    function assignOrderStage(id, userId) {
        stagesForm.setData('stage_assignments', { ...stagesForm.data.stage_assignments, [id]: userId });
    }

    function submitStages(e) {
        e.preventDefault();
        stagesForm.put(`/orders/${order.id}/stages`, { preserveScroll: true });
    }

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

            {stageOptions && stageOptions.length > 0 && (
                <form onSubmit={submitStages} className="max-w-2xl mt-6">
                    <div className="bg-white rounded-2xl border border-cream-3 p-5">
                        <p className="font-bold text-ink text-sm mb-1">مراحل العمل</p>
                        <p className="text-xs text-muted mb-3">مراحل بدأ أو انتهى العمل عليها لا يمكن إلغاؤها من هون.</p>
                        {stagesForm.errors.stage_definition_ids && <p className="text-red-500 text-xs mb-2">{stagesForm.errors.stage_definition_ids}</p>}
                        {stagesForm.errors.stage_assignments && <p className="text-red-500 text-xs mb-2">{stagesForm.errors.stage_assignments}</p>}
                        <div className="flex flex-wrap gap-3">
                            {stageOptions.map(stage => {
                                const instance = instanceByStage[stage.id];
                                const isLockedIn = ['in_progress', 'done'].includes(instance?.status);
                                const checked = stagesForm.data.stage_definition_ids.includes(stage.id);

                                return (
                                    <div key={stage.id} className={`px-3 py-2 rounded-xl border-2 ${checked ? 'border-primary bg-primary-pale' : 'border-cream-3 bg-cream'}`}>
                                        <label className={`flex items-center gap-2 ${isLockedIn ? '' : 'cursor-pointer'}`}>
                                            <input type="checkbox" checked={checked} disabled={isLockedIn}
                                                onChange={() => toggleOrderStage(stage.id)} className="accent-primary w-4 h-4" />
                                            <span className="text-sm text-ink">{stage.name_ar}</span>
                                        </label>
                                        {instance && (
                                            <p className="text-[11px] text-muted mt-1">{STAGE_STATUS_LABELS[instance.status] ?? instance.status}</p>
                                        )}
                                        {checked && !isLockedIn && stage.workers.length > 0 && (
                                            <select value={stagesForm.data.stage_assignments[stage.id] ?? ''}
                                                onChange={e => assignOrderStage(stage.id, e.target.value)}
                                                className="mt-2 w-full px-2 py-1.5 border-2 border-cream-3 rounded-lg text-xs focus:border-primary outline-none bg-white">
                                                <option value="">عيّن لعامل محدد (اختياري)</option>
                                                {stage.workers.map(worker => (
                                                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button disabled={stagesForm.processing} className="mt-4 bg-ink text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-primary transition-colors">
                            {stagesForm.processing ? '⏳ جاري الحفظ...' : 'حفظ مراحل العمل'}
                        </button>
                    </div>
                </form>
            )}
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
