import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Users({ users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'worker',
        password: '',
    });
    const [editingUser, setEditingUser] = useState(null);

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

            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}

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
                                    <button onClick={() => setEditingUser(u)} className="text-primary hover:underline text-xs font-bold ml-3">
                                        ✏️ تعديل
                                    </button>
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

function EditUserModal({ user, onClose }) {
    const { auth } = usePage().props;
    const isEditingSelf = auth?.user?.id === user.id;

    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        role: user.role ?? 'worker',
        password: '',
    });

    // Fresh form state per user opened, and auto-close once the save
    // actually lands (put() doesn't resolve synchronously, so this can't
    // just be inlined into the submit handler).
    const [justSaved, setJustSaved] = useState(false);
    useEffect(() => {
        if (justSaved) onClose();
    }, [justSaved]);

    function submit(e) {
        e.preventDefault();
        put(`/admin/users/${user.id}`, {
            onSuccess: () => { reset('password'); setJustSaved(true); },
        });
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                <p className="font-black text-ink text-sm">تعديل بيانات {user.name}</p>

                <Field label="الاسم" value={data.name} onChange={v => setData('name', v)} error={errors.name} />
                <Field label="البريد الإلكتروني" value={data.email} onChange={v => setData('email', v)} error={errors.email} type="email" />
                <Field label="الهاتف" value={data.phone} onChange={v => setData('phone', v)} error={errors.phone} />
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">الدور</label>
                    <select value={data.role} onChange={e => setData('role', e.target.value)} disabled={isEditingSelf}
                        className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none disabled:bg-cream-2 disabled:text-muted">
                        <option value="worker">عامل</option>
                        <option value="admin">مدير</option>
                    </select>
                    {isEditingSelf && (
                        <p className="text-[11px] text-muted mt-1">ما تقدر تغيّر دورك بنفسك (حتى ما تفقد الوصول لحسابك).</p>
                    )}
                </div>
                <Field label="كلمة مرور جديدة (اتركه فاضي إذا ما بدك تغيّرها)" value={data.password}
                    onChange={v => setData('password', v)} error={errors.password} type="password" />

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose}
                        className="flex-1 bg-cream-2 border border-cream-3 text-ink py-2.5 rounded-xl text-sm font-bold hover:bg-cream-3 transition-colors">
                        إلغاء
                    </button>
                    <button disabled={processing}
                        className="flex-1 bg-ink text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary transition-colors disabled:opacity-60">
                        {processing ? '⏳ جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none w-full" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
