import { Head, useForm, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Users({ users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'worker',
        password: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/users', { onSuccess: () => reset() });
    }

    function previewAs(user) {
        router.post(`/admin/users/${user.id}/impersonate`);
    }

    return (
        <AdminLayout title="العمال">
            <Head title="العمال" />

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <Field label="الاسم" value={data.name} onChange={v => setData('name', v)} error={errors.name} />
                <Field label="البريد الإلكتروني" value={data.email} onChange={v => setData('email', v)} error={errors.email} type="email" />
                <Field label="الهاتف" value={data.phone} onChange={v => setData('phone', v)} error={errors.phone} />
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الدور</label>
                    <select value={data.role} onChange={e => setData('role', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none">
                        <option value="worker">عامل</option>
                        <option value="admin">مدير</option>
                    </select>
                </div>
                <Field label="كلمة المرور" value={data.password} onChange={v => setData('password', v)} error={errors.password} type="password" />
                <button disabled={processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + إضافة عامل
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الاسم</th>
                            <th className="px-5 py-2">البريد الإلكتروني</th>
                            <th className="px-5 py-2">الدور</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{u.name}</td>
                                <td className="px-5 py-3 text-muted">{u.email}</td>
                                <td className="px-5 py-3">{u.role === 'admin' ? 'مدير' : 'عامل'}</td>
                                <td className="px-5 py-3 text-left whitespace-nowrap">
                                    <Link href={`/admin/users/${u.id}/permissions`} className="text-primary hover:underline text-xs font-bold ml-3">
                                        الصلاحيات
                                    </Link>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => previewAs(u)} className="text-ink hover:underline text-xs font-bold">
                                            👁️ معاينة شاشته
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
