import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

const fieldTypes = [
    { value: 'text', label: 'نص' },
    { value: 'number', label: 'رقم' },
    { value: 'textarea', label: 'نص طويل' },
    { value: 'select', label: 'قائمة اختيار' },
    { value: 'boolean', label: 'نعم / لا' },
    { value: 'date', label: 'تاريخ' },
];

export default function SpecFields({ specFields }) {
    const { confirmAction, dialog } = useConfirm();
    const { data, setData, post, processing, errors, reset } = useForm({
        label_ar: '',
        label_en: '',
        field_type: 'text',
        options: '',
        is_required: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/spec-fields', {
            data: {
                ...data,
                options: data.field_type === 'select'
                    ? data.options.split(',').map(o => o.trim()).filter(Boolean)
                    : null,
            },
            onSuccess: () => reset(),
        });
    }

    function toggleActive(field) {
        updateField(field, 'is_active', !field.is_active);
    }

    function toggleRequired(field) {
        updateField(field, 'is_required', !field.is_required);
    }

    function updateField(field, key, value) {
        router.put(`/admin/spec-fields/${field.id}`, {
            label_ar: field.label_ar,
            label_en: field.label_en,
            field_type: field.field_type,
            options: field.options,
            is_required: field.is_required,
            sort_order: field.sort_order,
            is_active: field.is_active,
            [key]: value,
        }, { preserveScroll: true });
    }

    function destroy(field) {
        confirmAction(`حذف "${field.label_ar}"؟`, (cb) => router.delete(`/admin/spec-fields/${field.id}`, cb));
    }

    return (
        <AdminLayout title="حقول المواصفات">
            <Head title="حقول المواصفات" />
            {dialog}

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">اسم الحقل</label>
                    <input value={data.label_ar} onChange={e => setData('label_ar', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    {errors.label_ar && <p className="text-red-500 text-xs mt-1">{errors.label_ar}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">نوع الحقل</label>
                    <select value={data.field_type} onChange={e => setData('field_type', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none">
                        {fieldTypes.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                </div>
                {data.field_type === 'select' && (
                    <div>
                        <label className="text-xs font-bold text-muted block mb-1">الخيارات (مفصولة بفاصلة)</label>
                        <input value={data.options} onChange={e => setData('options', e.target.value)}
                            placeholder="أبيض, أصفر دافئ, RGB"
                            className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-64" />
                    </div>
                )}
                <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
                    <input type="checkbox" checked={data.is_required} onChange={e => setData('is_required', e.target.checked)}
                        className="accent-primary w-4 h-4" />
                    <span className="text-sm text-muted">إلزامي</span>
                </label>
                <button disabled={processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + إضافة
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الحقل</th>
                            <th className="px-5 py-2">النوع</th>
                            <th className="px-5 py-2">إلزامي</th>
                            <th className="px-5 py-2">الحالة</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {specFields.map(field => (
                            <tr key={field.id} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{field.label_ar}</td>
                                <td className="px-5 py-3 text-muted">{fieldTypes.find(ft => ft.value === field.field_type)?.label}</td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleRequired(field)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${field.is_required ? 'bg-amber-100 text-amber-700' : 'bg-cream-2 text-muted'}`}>
                                        {field.is_required ? 'إلزامي' : 'اختياري'}
                                    </button>
                                </td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleActive(field)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${field.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {field.is_active ? 'مفعّل' : 'معطّل'}
                                    </button>
                                </td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => destroy(field)} className="text-red-500 hover:underline text-xs">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
