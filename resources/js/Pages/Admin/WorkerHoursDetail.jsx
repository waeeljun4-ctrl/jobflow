import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function WorkerHoursDetail({ worker, daily, monthly, tasks }) {
    const { confirmAction, dialog } = useConfirm();
    const [resetting, setResetting] = useState(false);

    function resetAll() {
        confirmAction(
            `تصفير كل ساعات "${worker.name}"؟ رح تنحفظ الساعات الحالية بالأرشيف أول، وبعدين تصفر كل مهامه.`,
            (cb) => {
                setResetting(true);
                router.post(`/admin/worker-hours/${worker.id}/reset-all`, {}, {
                    ...cb,
                    onFinish: () => { setResetting(false); cb.onFinish(); },
                });
            }
        );
    }

    return (
        <AdminLayout title={`ساعات عمل ${worker.name}`}>
            <Head title={`ساعات عمل ${worker.name}`} />
            {dialog}

            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <Link href="/admin/worker-hours" className="text-xs text-muted hover:underline">← كل العمال</Link>
                    <p className="text-lg font-black text-ink mt-1">{worker.name}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetAll} disabled={resetting}
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                        {resetting ? '⏳...' : '🗑️ تصفير كل الساعات'}
                    </button>
                    <a href={`/admin/worker-hours/${worker.id}/print`} target="_blank" rel="noreferrer"
                        className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-colors">
                        🖨️ طباعة السجل
                    </a>
                </div>
            </div>

            {/* Monthly summary */}
            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden mb-6">
                <p className="px-5 py-3 border-b border-cream-3 font-bold text-sm text-ink">الملخص الشهري</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الشهر</th>
                            <th className="px-5 py-2">مجموع الساعات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthly.map(month => (
                            <tr key={month.month} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{month.label}</td>
                                <td className="px-5 py-3 font-black text-primary">{month.total_hours} ساعة</td>
                            </tr>
                        ))}
                        {monthly.length === 0 && (
                            <tr><td colSpan={2} className="px-5 py-6 text-center text-muted">لا يوجد بيانات</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Daily log */}
            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <p className="px-5 py-3 border-b border-cream-3 font-bold text-sm text-ink">السجل اليومي</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">التاريخ</th>
                            <th className="px-5 py-2">اليوم</th>
                            <th className="px-5 py-2">الساعات</th>
                            <th className="px-5 py-2">الطلبيات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {daily.map(day => (
                            <tr key={day.date} className="border-t border-cream-3">
                                <td className="px-5 py-3 text-muted">{day.date_label}</td>
                                <td className="px-5 py-3 text-muted">{day.day_name}</td>
                                <td className="px-5 py-3 font-black text-primary">{day.total_hours} ساعة</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {day.orders.map((order, i) => (
                                            <span key={i} className="bg-cream-2 rounded-lg px-2.5 py-1 text-xs">
                                                <span className="font-bold text-ink">{order.order_number}</span>
                                                <span className="text-muted"> ({order.customer_name} — {order.hours} س)</span>
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {daily.length === 0 && (
                            <tr><td colSpan={4} className="px-5 py-6 text-center text-muted">لا يوجد بيانات</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Raw task list — for correcting one specific task's hours,
                e.g. one a worker forgot to close and kept counting since. */}
            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden mt-6">
                <p className="px-5 py-3 border-b border-cream-3 font-bold text-sm text-ink">المهام (تعديل الساعات يدوياً)</p>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">الطلبية</th>
                            <th className="px-5 py-2">المرحلة</th>
                            <th className="px-5 py-2">البداية</th>
                            <th className="px-5 py-2">النهاية</th>
                            <th className="px-5 py-2">الساعات</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(tasks ?? []).map(task => (
                            <TaskRow key={task.id} task={task} />
                        ))}
                        {(tasks ?? []).length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">لا يوجد مهام</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function TaskRow({ task }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(task.manual_hours ?? task.elapsed_hours ?? 0);
    const [saving, setSaving] = useState(false);

    function save() {
        setSaving(true);
        router.patch(`/admin/worker-hours/tasks/${task.id}`, { manual_hours: value }, {
            preserveScroll: true,
            onFinish: () => { setSaving(false); setEditing(false); },
        });
    }

    function resetToAuto() {
        setSaving(true);
        router.patch(`/admin/worker-hours/tasks/${task.id}`, { manual_hours: null }, {
            preserveScroll: true,
            onFinish: () => { setSaving(false); setEditing(false); },
        });
    }

    return (
        <tr className="border-t border-cream-3">
            <td className="px-5 py-3 font-bold text-ink">{task.order_number}<span className="text-muted font-normal"> — {task.customer_name}</span></td>
            <td className="px-5 py-3 text-muted">{task.stage_name}</td>
            <td className="px-5 py-3 text-muted text-xs">{task.started_at}</td>
            <td className="px-5 py-3 text-xs">
                {task.is_running
                    ? <span className="text-orange-500 font-bold">لسا شغالة</span>
                    : <span className="text-muted">{task.completed_at}</span>}
            </td>
            <td className="px-5 py-3">
                {editing ? (
                    <input type="number" min="0" step="0.1" value={value} onChange={e => setValue(e.target.value)}
                        className="w-20 px-2 py-1 border-2 border-cream-3 rounded-lg text-sm focus:border-primary outline-none" />
                ) : (
                    <span className="font-black text-primary">
                        {task.elapsed_hours} ساعة
                        {task.manual_hours !== null && <span className="text-[10px] text-orange-500 font-bold mr-1">(معدّلة)</span>}
                    </span>
                )}
            </td>
            <td className="px-5 py-3 text-left">
                {editing ? (
                    <div className="flex gap-1.5 justify-end">
                        <button onClick={save} disabled={saving} className="text-xs font-bold text-green-600 hover:underline disabled:opacity-50">حفظ</button>
                        <button onClick={() => setEditing(false)} disabled={saving} className="text-xs text-muted hover:underline">إلغاء</button>
                    </div>
                ) : (
                    <div className="flex gap-2.5 justify-end">
                        <button onClick={() => setEditing(true)} className="text-xs font-bold text-primary hover:underline">✏️ تعديل</button>
                        {task.manual_hours !== null && (
                            <button onClick={resetToAuto} disabled={saving} className="text-xs text-muted hover:underline disabled:opacity-50">إرجاع تلقائي</button>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}
