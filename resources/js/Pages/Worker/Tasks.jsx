import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import WorkerLayout from '@/Layouts/WorkerLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import CopyButton from '@/Components/CopyButton';
import { useConfirm } from '@/Components/useConfirm';

const statusStyles = {
    available: 'bg-primary-pale text-primary',
    in_progress: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
};

const statusLabels = {
    available: 'متاح',
    in_progress: 'قيد التنفيذ',
    done: 'منتهي',
};

export default function Tasks({ tasks, offShift }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
    const [sendBackTask, setSendBackTask] = useState(null);
    const [targetId, setTargetId] = useState('');
    const [reason, setReason] = useState('');
    const [shortageTask, setShortageTask] = useState(null);
    const [pauseReason, setPauseReason] = useState('');
    const [showDone, setShowDone] = useState(false);
    const { confirmAction, dialog } = useConfirm();

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const doneTasks = tasks.filter(t => t.status === 'done');

    function start(task) {
        router.post(`/my/tasks/${task.id}/start`);
    }

    function complete(task) {
        confirmAction('تأكيد إنهاء هذه المرحلة؟', (cb) => router.post(`/my/tasks/${task.id}/complete`, {}, cb));
    }

    function openSendBack(task) {
        setSendBackTask(task);
        setTargetId(task.depends_on?.[0]?.id ?? '');
        setReason('');
    }

    function confirmSendBack() {
        if (! targetId || ! reason.trim()) return;
        router.post(`/my/tasks/${sendBackTask.id}/send-back`, {
            target_stage_instance_id: targetId,
            reason,
        }, {
            onSuccess: () => setSendBackTask(null),
        });
    }

    function openShortagePause(task) {
        setShortageTask(task);
        setPauseReason('');
    }

    function confirmShortagePause() {
        if (! pauseReason.trim()) return;
        router.post(`/my/tasks/${shortageTask.id}/pause`, {
            type: 'shortage',
            reason: pauseReason,
        }, {
            onSuccess: () => setShortageTask(null),
        });
    }

    function resume(task) {
        router.post(`/my/tasks/${task.id}/resume`);
    }

    // Global, not per-order — a worker going home shouldn't have to open
    // every single task to say so. One click pauses everything they're
    // currently assigned to; one click on the way back resumes all of it.
    function endShift() {
        router.post('/my/end-shift');
    }

    function startShift() {
        router.post('/my/start-shift');
    }

    const Layout = isAdmin ? AdminLayout : WorkerLayout;

    return (
        <Layout title="مهامي">
            <Head title="مهامي" />
            {dialog}

            <div className="max-w-2xl mb-4">
                {offShift ? (
                    <div className="bg-cream-2 border border-cream-3 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="font-black text-ink text-sm">🏠 أنت خارج الدوام حالياً</p>
                            <p className="text-xs text-muted mt-0.5">كل مهامك النشطة متوقفة مؤقتاً — اضغط "بدء الدوام" لما ترجع تشتغل.</p>
                        </div>
                        <button onClick={startShift}
                            className="shrink-0 bg-stage-done text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-colors">
                            ▶️ بدء الدوام
                        </button>
                    </div>
                ) : (
                    <button onClick={endShift}
                        className="w-full bg-white border border-cream-3 rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-muted hover:bg-cream-2 hover:text-ink transition-colors">
                        🏠 إنهاء الدوام (رايح عالبيت)
                    </button>
                )}
            </div>

            <div className="space-y-3 max-w-2xl">
                {activeTasks.length === 0 && (
                    <div className="bg-white rounded-2xl border border-cream-3 p-8 text-center text-muted">
                        لا يوجد مهام متاحة حالياً
                    </div>
                )}

                {activeTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStart={start} onComplete={complete} onSendBack={openSendBack}
                        onShortagePause={openShortagePause} onResume={resume} />
                ))}

                {doneTasks.length > 0 && (
                    <div>
                        <button onClick={() => setShowDone(v => !v)}
                            className="w-full flex items-center justify-between bg-white rounded-2xl border border-cream-3 p-4 text-sm font-bold text-ink hover:bg-cream-2 transition-colors">
                            <span>✅ تم الانتهاء ({doneTasks.length})</span>
                            <span className="text-muted">{showDone ? '▲' : '▼'}</span>
                        </button>
                        {showDone && (
                            <div className="space-y-3 mt-3">
                                {doneTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onStart={start} onComplete={complete} onSendBack={openSendBack}
                        onShortagePause={openShortagePause} onResume={resume} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {sendBackTask && (
                <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
                    onClick={e => e.target === e.currentTarget && setSendBackTask(null)}>
                    <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
                        <p className="font-black text-ink text-sm">
                            إرجاع طلبية {sendBackTask.order?.order_number}
                        </p>
                        <p className="text-xs text-muted">
                            سيتم إرجاعها للمرحلة المختارة لإعادة العمل عليها، وستُقفل مرحلة
                            "{sendBackTask.stage_definition?.name_ar}" وأي مرحلة بعدها حتى تُنجز من جديد.
                        </p>

                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">إرجاع إلى</label>
                            <select value={targetId} onChange={e => setTargetId(e.target.value)}
                                className="w-full border border-cream-3 rounded-xl px-3 py-2 text-sm text-ink">
                                {sendBackTask.depends_on?.map(dep => (
                                    <option key={dep.id} value={dep.id}>{dep.stage_definition?.name_ar}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">
                                سبب الإرجاع <span className="text-red-500">*</span>
                            </label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                                className="w-full border border-cream-3 rounded-xl px-3 py-2 text-sm text-ink resize-none"
                                placeholder="مثلاً: القص مو مطابق للمقاس" />
                            {! reason.trim() && (
                                <p className="text-[11px] text-muted mt-1">لازم تكتب السبب قبل ما ترجع الطلبية.</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setSendBackTask(null)}
                                className="flex-1 bg-cream-2 border border-cream-3 text-ink py-2 rounded-xl text-sm font-bold hover:bg-cream-3 transition-colors">
                                إلغاء
                            </button>
                            <button onClick={confirmSendBack} disabled={! reason.trim()}
                                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                تأكيد الإرجاع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {shortageTask && (
                <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
                    onClick={e => e.target === e.currentTarget && setShortageTask(null)}>
                    <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
                        <p className="font-black text-ink text-sm">
                            إيقاف طلبية {shortageTask.order?.order_number} مؤقتاً
                        </p>
                        <p className="text-xs text-muted">
                            بتضل الطلبية عندك، وما حدا غيرك بيقدر ياخدها — بس التنبيه رح يوصل للإدارة عشان تحل المشكلة.
                        </p>

                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">
                                سبب التوقف <span className="text-red-500">*</span>
                            </label>
                            <textarea value={pauseReason} onChange={e => setPauseReason(e.target.value)} rows={2}
                                className="w-full border border-cream-3 rounded-xl px-3 py-2 text-sm text-ink resize-none"
                                placeholder="مثلاً: نقص دهان، نقص حديد، نقص كابوند" />
                            {! pauseReason.trim() && (
                                <p className="text-[11px] text-muted mt-1">لازم تكتب السبب قبل ما توقف الطلبية.</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShortageTask(null)}
                                className="flex-1 bg-cream-2 border border-cream-3 text-ink py-2 rounded-xl text-sm font-bold hover:bg-cream-3 transition-colors">
                                إلغاء
                            </button>
                            <button onClick={confirmShortagePause} disabled={! pauseReason.trim()}
                                className="flex-1 bg-amber-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                تأكيد التوقف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function TaskCard({ task, onStart, onComplete, onSendBack, onShortagePause, onResume }) {
    const pause = task.current_pause;
    const isShortagePaused = pause?.type === 'shortage';
    const isEndOfDayPaused = pause?.type === 'end_of_day';
    const isPaused = !! pause;
    return (
        <div className="bg-white rounded-2xl border border-cream-3 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href={`/orders/${task.order_id}`} className="font-black text-ink hover:text-primary">
                            {task.order?.order_number}
                        </Link>
                        <CopyButton text={task.order?.order_number} />
                    </div>
                    <p className="text-xs text-muted mt-0.5">{task.order?.customer_name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${statusStyles[task.status] ?? ''}`}>
                    {statusLabels[task.status] ?? task.status}
                </span>
            </div>

            <p className="text-sm text-ink mb-2">
                {task.stage_definition?.name_ar}
            </p>

            {task.last_send_back_reason && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-3">
                    ↩ مُرجع لسبب: {task.last_send_back_reason}
                </p>
            )}

            {isShortagePaused && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3">
                    ⚠️ متوقفة مؤقتاً: {pause.reason}
                </p>
            )}

            {isEndOfDayPaused && (
                <p className="text-xs text-muted bg-cream-2 border border-cream-3 rounded-lg px-2.5 py-1.5 mb-3">
                    🏠 متوقفة — خارج الدوام (استخدم زر "بدء الدوام" فوق)
                </p>
            )}

            <div className="flex gap-2 flex-wrap">
                {! isPaused && task.status === 'available' && (
                    <button onClick={() => onStart(task)}
                        className="px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-bold hover:bg-primary transition-colors">
                        بدء العمل
                    </button>
                )}
                {! isPaused && (task.status === 'available' || task.status === 'in_progress') && (
                    <button onClick={() => onComplete(task)}
                        className="px-3 py-1.5 rounded-lg bg-stage-done text-white text-xs font-bold hover:opacity-90 transition-colors">
                        تم الانتهاء
                    </button>
                )}
                {! isPaused && (task.status === 'available' || task.status === 'in_progress') && task.depends_on?.length > 0 && (
                    <button onClick={() => onSendBack(task)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">
                        ↩ إرجاع لمرحلة سابقة
                    </button>
                )}
                {! isPaused && (task.status === 'available' || task.status === 'in_progress') && (
                    <button onClick={() => onShortagePause(task)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors">
                        ⚠️ توقف مؤقتاً
                    </button>
                )}
                {isShortagePaused && (
                    <button onClick={() => onResume(task)}
                        className="px-3 py-1.5 rounded-lg bg-stage-done text-white text-xs font-bold hover:opacity-90 transition-colors">
                        ▶️ استئناف العمل
                    </button>
                )}
            </div>
        </div>
    );
}
