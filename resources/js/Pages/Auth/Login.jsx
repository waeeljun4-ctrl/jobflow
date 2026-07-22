import { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: false,
    });
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('sessionExpired')) {
            sessionStorage.removeItem('sessionExpired');
            setSessionExpired(true);
        }
    }, []);

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="تسجيل الدخول" />
            <div className="min-h-screen bg-gradient-to-br from-ink to-ink-2 flex items-center justify-center p-4 font-cairo">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-ink">
                            Job<span className="text-primary">Flow</span>
                        </h1>
                        <p className="text-xs text-muted mt-1 tracking-widest">نظام إدارة الإنتاج</p>
                    </div>

                    {sessionExpired && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mb-4 text-center leading-relaxed">
                            انتهت جلستك، رجاءً سجل دخول من جديد
                        </p>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold tracking-widest uppercase text-muted block mb-1.5">رقم الهاتف أو البريد الإلكتروني</label>
                            <input
                                type="text"
                                dir="ltr"
                                value={data.login}
                                onChange={e => setData('login', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl text-sm text-ink bg-cream outline-none transition-colors font-cairo text-left
                                    ${errors.login ? 'border-red-400' : 'border-cream-3 focus:border-primary'}`}
                                placeholder="0598088792"
                                autoComplete="username"
                            />
                            {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold tracking-widest uppercase text-muted block mb-1.5">كلمة المرور</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl text-sm text-ink bg-cream outline-none transition-colors font-cairo
                                    ${errors.password ? 'border-red-400' : 'border-cream-3 focus:border-primary'}`}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.remember} onChange={e => setData('remember', e.target.checked)}
                                className="accent-primary w-4 h-4 rounded" />
                            <span className="text-sm text-muted">تذكرني</span>
                        </label>

                        <button type="submit" disabled={processing}
                            className="w-full bg-ink text-white py-3 rounded-xl font-black text-sm hover:bg-primary transition-colors disabled:opacity-60 mt-2">
                            {processing ? '⏳ جاري الدخول...' : 'دخول ←'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
