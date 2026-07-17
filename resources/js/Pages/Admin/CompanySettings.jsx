import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CompanySettings({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        name: settings.name ?? '',
        phone: settings.phone ?? '',
        address: settings.address ?? '',
        logo: null,
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/settings/company', { forceFormData: true });
    }

    return (
        <AdminLayout title="بيانات الشركة">
            <Head title="بيانات الشركة" />

            <p className="text-xs text-muted mb-4">تظهر هذه البيانات تلقائياً أعلى كل عرض سعر يتم طباعته.</p>

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 max-w-xl space-y-4">
                <Field label="اسم الشركة" value={data.name} onChange={v => setData('name', v)} error={errors.name} />
                <Field label="رقم الهاتف" value={data.phone} onChange={v => setData('phone', v)} error={errors.phone} />
                <Field label="العنوان" value={data.address} onChange={v => setData('address', v)} error={errors.address} />

                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الشعار (اللوغو)</label>
                    {settings.logo_url && (
                        <img src={settings.logo_url} alt="الشعار الحالي" className="h-16 mb-2 rounded-lg border border-cream-3" />
                    )}
                    <input type="file" accept="image/*" onChange={e => setData('logo', e.target.files[0])}
                        className="w-full text-sm" />
                    {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
                </div>

                <button disabled={processing} className="bg-ink text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    حفظ
                </button>
            </form>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
