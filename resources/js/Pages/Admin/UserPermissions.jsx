import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function UserPermissions({ targetUser, mandatoryStages, conditionalStages, pagePermissions, actionPermissions, grantedPermissions }) {
    const { data, setData, put, processing } = useForm({
        permissions: grantedPermissions,
    });

    function toggle(name) {
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter(p => p !== name)
            : [...data.permissions, name]);
    }

    function submit(e) {
        e.preventDefault();
        put(`/admin/users/${targetUser.id}/permissions`);
    }

    return (
        <AdminLayout title={`صلاحيات: ${targetUser.name}`}>
            <Head title="صلاحيات العامل" />

            <form onSubmit={submit} className="max-w-lg">
                <Section title="مراحل دائمة (تصير لكل طلبية)" items={mandatoryStages} data={data} toggle={toggle} />
                <Section title="مراحل شرطية (حسب الطلبية)" items={conditionalStages} data={data} toggle={toggle} />
                <Section title="صفحات الإدارة" items={pagePermissions} data={data} toggle={toggle} />
                <Section title="صلاحيات إضافية" items={actionPermissions} data={data} toggle={toggle} />

                <button disabled={processing} className="bg-ink text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    حفظ الصلاحيات
                </button>
            </form>
        </AdminLayout>
    );
}

function Section({ title, items, data, toggle }) {
    if (items.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-4">
            <p className="font-bold text-ink text-sm mb-3">{title}</p>
            <div className="space-y-2">
                {items.map(item => (
                    <label key={item.name} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.permissions.includes(item.name)}
                            onChange={() => toggle(item.name)}
                            className="accent-primary w-4 h-4 rounded" />
                        <span className="text-sm text-ink">{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
