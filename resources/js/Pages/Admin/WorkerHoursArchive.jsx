import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Components/useConfirm';

export default function WorkerHoursArchive({ archives }) {
    const { confirmAction, dialog } = useConfirm();

    function destroy(a) {
        confirmAction(`حذف سجل تصفير "${a.worker_name}" (${a.total_hours} ساعة)؟`,
            (cb) => router.delete(`/admin/worker-hours-archive/${a.id}`, cb));
    }

    return (
        <AdminLayout title="أرشيف ساعات العمل">
            <Head title="أرشيف ساعات العمل" />
            {dialog}

            <div className="mb-4">
                <Link href="/admin/worker-hours" className="text-xs text-muted hover:underline">← ساعات عمل العمال</Link>
                <p className="text-lg font-black text-ink mt-1">📁 أرشيف ساعات العمل</p>
                <p className="text-xs text-muted mt-1">سجلات الساعات يلي انحفظت تلقائياً كل ما صفّرت ساعات عامل بالكامل.</p>
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">العامل</th>
                            <th className="px-5 py-2">الساعات المؤرشفة</th>
                            <th className="px-5 py-2">صفّرها</th>
                            <th className="px-5 py-2">التاريخ</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {archives.map(a => (
                            <tr key={a.id} className="border-t border-cream-3">
                                <td className="px-5 py-3 font-bold text-ink">{a.worker_name}</td>
                                <td className="px-5 py-3 font-black text-primary">{a.total_hours} ساعة</td>
                                <td className="px-5 py-3 text-muted">{a.archived_by}</td>
                                <td className="px-5 py-3 text-muted text-xs">{a.archived_at}</td>
                                <td className="px-5 py-3 text-left">
                                    <button onClick={() => destroy(a)} className="text-xs text-red-500 hover:underline">🗑️ حذف</button>
                                </td>
                            </tr>
                        ))}
                        {archives.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-6 text-center text-muted">لا يوجد سجلات بالأرشيف بعد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
