import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkerLayout from '@/Layouts/WorkerLayout';

export default function Profile({ user }) {
    const { auth } = usePage().props;
    const Layout = auth?.user?.role === 'admin' ? AdminLayout : WorkerLayout;

    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        put('/profile/password', { onSuccess: () => reset() });
    }

    return (
        <Layout title="الحساب">
            <Head title="الحساب" />

            <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 max-w-md">
                <p className="font-bold text-ink text-sm mb-3">بياناتي</p>
                <dl className="space-y-2 text-sm">
                    <div>
                        <dt className="text-muted text-xs">الاسم</dt>
                        <dd className="text-ink font-bold">{user.name}</dd>
                    </div>
                    {user.email && (
                        <div>
                            <dt className="text-muted text-xs">البريد الإلكتروني</dt>
                            <dd className="text-ink">{user.email}</dd>
                        </div>
                    )}
                    {user.phone && (
                        <div>
                            <dt className="text-muted text-xs">رقم الهاتف</dt>
                            <dd className="text-ink" dir="ltr">{user.phone}</dd>
                        </div>
                    )}
                </dl>
            </div>

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 max-w-md space-y-4">
                <p className="font-bold text-ink text-sm">تغيير كلمة المرور</p>

                <Field label="كلمة المرور الحالية" type="password" value={data.current_password}
                    onChange={v => setData('current_password', v)} error={errors.current_password} />
                <Field label="كلمة المرور الجديدة" type="password" value={data.password}
                    onChange={v => setData('password', v)} error={errors.password} />
                <Field label="تأكيد كلمة المرور الجديدة" type="password" value={data.password_confirmation}
                    onChange={v => setData('password_confirmation', v)} />

                <button disabled={processing}
                    className="bg-ink text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors disabled:opacity-60">
                    {processing ? '⏳ جاري الحفظ...' : 'حفظ كلمة المرور'}
                </button>
            </form>
        </Layout>
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
