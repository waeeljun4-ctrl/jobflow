import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import WorkerLayout from '@/Layouts/WorkerLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import CopyButton from '@/Components/CopyButton';

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

export default function Tasks({ tasks }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
    const [sendBackTask, setSendBackTask] = useState(null);
    const [targetId, setTargetId] = useState('');
    const [reason, setReason] = useState('');
    const [showDone, setShowDone] = useState(false);

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const doneTasks = tasks.filter(t => t.status === 'done');

    function start(task) {
        router.post(`/my/tasks/${task.id}/start`);
    }

    function complete(task) {
        if (confirm('تأكيد إنهاء هذه المرحلة؟')) {
            router.post(`/my/tasks/${task.id}/complete`);
        }
    }

    function openSendBack(task) {
        setSendBackTask(task);
        setTargetId(task.depends_on?.[0]?.id ?? '');
        setReason('');
    }

    function confirmSendBack() {
        if (! targetId) return;
        router.post(`/my/tasks/${sendBackTask.id}/send-back`, {
            target_stage_instance_id: targetId,
            reason,
        }, {
            onSuccess: () => setSendBackTask(null),
        });
    }

    const Layout = isAdmin ? AdminLayout : WorkerLayout;

    return (
        <Layout title="مهامي">
            <Head title="مهامي" />

            <div className="space-y-3 max-w-2xl">
                {activeTasks.length === 0 && (
                    <div className="bg-white rounded-2xl border border-cream-3 p-8 text-center text-muted">
                        لا يوجد مهام متاحة حالياً
                    </div>
                )}

                {activeTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStart={start} onComplete={complete} onSendBack={openSendBack} />
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
                                    <TaskCard key={task.id} task={task} onStart={start} onComplete={complete} onSendBack={openSendBack} />
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
                            <label className="text-xs font-bold text-muted block mb-1">سبب الإرجاع (اختياري)</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                                className="w-full border border-cream-3 rounded-xl px-3 py-2 text-sm text-ink resize-none"
                                placeholder="مثلاً: القص مو مطابق للمقاس" />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setSendBackTask(null)}
                                className="flex-1 bg-cream-2 border border-cream-3 text-ink py-2 rounded-xl text-sm font-bold hover:bg-cream-3 transition-colors">
                                إلغاء
                            </button>
                            <button onClick={confirmSendBack}
                                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                                تأكيد الإرجاع
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function TaskCard({ task, onStart, onComplete, onSendBack }) {
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

            <p className="text-sm text-ink mb-3">
                {task.stage_definition?.name_ar}
            </p>

            <div className="flex gap-2">
                {task.status === 'available' && (
                    <button onClick={() => onStart(task)}
                        className="px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-bold hover:bg-primary transition-colors">
                        بدء العمل
                    </button>
                )}
                {(task.status === 'available' || task.status === 'in_progress') && (
                    <button onClick={() => onComplete(task)}
                        className="px-3 py-1.5 rounded-lg bg-stage-done text-white text-xs font-bold hover:opacity-90 transition-colors">
                        تم الانتهاء
                    </button>
                )}
                {(task.status === 'available' || task.status === 'in_progress') && task.depends_on?.length > 0 && (
                    <button onClick={() => onSendBack(task)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">
                        ↩ إرجاع لمرحلة سابقة
                    </button>
                )}
            </div>
        </div>
    );
}
