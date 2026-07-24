import { useState } from 'react';

// Not window.confirm() — it's unreliable inside some embedded/webview
// browsers (silently resolves as "cancelled" even when the user picks OK),
// which made confirm-gated actions across the app look like they were
// doing nothing. This renders an in-page dialog instead.
//
// onConfirm receives Inertia-style { onSuccess, onError, onFinish }
// callbacks so the dialog can show a loading state and, critically, an
// actual error message instead of just closing and silently doing nothing
// when the request fails.
export function useConfirm() {
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    function confirmAction(message, onConfirm) {
        setPending({ message, onConfirm });
        setError('');
    }

    function run() {
        setBusy(true);
        setError('');
        pending.onConfirm({
            onSuccess: () => { setBusy(false); setPending(null); },
            onError: (errors) => {
                setBusy(false);
                const first = errors && typeof errors === 'object' ? Object.values(errors)[0] : null;
                setError(first || 'صار خطأ، حاول مرة ثانية.');
            },
            onFinish: () => setBusy(false),
        });
    }

    const dialog = pending && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setPending(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <p className="text-sm text-ink font-bold mb-3 leading-relaxed">{pending.message}</p>
                {error && <p className="text-red-600 text-xs font-bold mb-3">{error}</p>}
                <div className="flex gap-2">
                    <button onClick={run} disabled={busy}
                        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">
                        {busy ? '⏳ جاري...' : 'تأكيد'}
                    </button>
                    <button onClick={() => setPending(null)} disabled={busy}
                        className="flex-1 bg-cream-2 text-ink py-2.5 rounded-xl text-sm font-bold hover:bg-cream-3 transition-colors disabled:opacity-60">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );

    return { confirmAction, dialog };
}
