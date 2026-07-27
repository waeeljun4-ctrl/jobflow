import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkerLayout from '@/Layouts/WorkerLayout';

export default function Profile({ user }) {
    const { auth } = usePage().props;
    const Layout = auth?.user?.role === 'admin' ? AdminLayout : WorkerLayout;

    const infoForm = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submitInfo(e) {
        e.preventDefault();
        infoForm.put('/profile');
    }

    function submitPassword(e) {
        e.preventDefault();
        passwordForm.put('/profile/password', { onSuccess: () => passwordForm.reset() });
    }

    return (
        <Layout title="الحساب">
            <Head title="الحساب" />

            <form onSubmit={submitInfo} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 max-w-md space-y-4">
                <p className="font-bold text-ink text-sm">بياناتي</p>

                <Field label="الاسم" value={infoForm.data.name}
                    onChange={v => infoForm.setData('name', v)} error={infoForm.errors.name} />
                <Field label="البريد الإلكتروني" type="email" value={infoForm.data.email}
                    onChange={v => infoForm.setData('email', v)} error={infoForm.errors.email} />
                <Field label="رقم الهاتف" value={infoForm.data.phone}
                    onChange={v => infoForm.setData('phone', v)} error={infoForm.errors.phone} />

                <button disabled={infoForm.processing}
                    className="bg-ink text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors disabled:opacity-60">
                    {infoForm.processing ? '⏳ جاري الحفظ...' : 'حفظ البيانات'}
                </button>
            </form>

            <form onSubmit={submitPassword} className="bg-white rounded-2xl border border-cream-3 p-5 max-w-md space-y-4">
                <p className="font-bold text-ink text-sm">تغيير كلمة المرور</p>

                <Field label="كلمة المرور الحالية" type="password" value={passwordForm.data.current_password}
                    onChange={v => passwordForm.setData('current_password', v)} error={passwordForm.errors.current_password} />
                <Field label="كلمة المرور الجديدة" type="password" value={passwordForm.data.password}
                    onChange={v => passwordForm.setData('password', v)} error={passwordForm.errors.password} />
                <Field label="تأكيد كلمة المرور الجديدة" type="password" value={passwordForm.data.password_confirmation}
                    onChange={v => passwordForm.setData('password_confirmation', v)} />

                <button disabled={passwordForm.processing}
                    className="bg-ink text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors disabled:opacity-60">
                    {passwordForm.processing ? '⏳ جاري الحفظ...' : 'حفظ كلمة المرور'}
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
