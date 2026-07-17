import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import CopyButton from '@/Components/CopyButton';
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusLabels = {
    available: 'متاح',
    in_progress: 'قيد التنفيذ',
};

export default function StageQueue({ stage, instances: initialInstances }) {
    const [instances, setInstances] = useState(initialInstances);

    useEffect(() => setInstances(initialInstances), [initialInstances]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = instances.findIndex(i => i.id === active.id);
        const newIndex = instances.findIndex(i => i.id === over.id);
        const reordered = arrayMove(instances, oldIndex, newIndex);

        setInstances(reordered);
        router.put(`/admin/stages/${stage.id}/queue/reorder`, {
            instances: reordered.map(i => i.id),
        }, { preserveScroll: true, preserveState: true });
    }

    return (
        <AdminLayout title={`قائمة انتظار: ${stage.name_ar}`}>
            <Head title={stage.name_ar} />

            <div className="mb-4">
                <Link href="/admin" className="text-sm text-primary hover:underline">← رجوع للوحة التحكم</Link>
            </div>

            <p className="text-sm text-muted mb-4 max-w-2xl">
                اسحب أي طلبية من المقبض ⠿ لترتيب أولويتها — سيراها العامل بنفس هذا الترتيب تماماً. انقر "نسخ" لنسخ رقم الطلبية كاسم للملف.
            </p>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-3 py-2 w-8"></th>
                            <th className="px-5 py-2">رقم الطلبية</th>
                            <th className="px-5 py-2">العميل</th>
                            <th className="px-5 py-2">الحالة</th>
                            <th className="px-5 py-2">المدة</th>
                            <th className="px-5 py-2">مسندة لـ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={instances.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {instances.map(instance => (
                                    <SortableQueueRow key={instance.id} instance={instance} />
                                ))}
                            </SortableContext>
                        </DndContext>
                        {instances.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">لا توجد طلبيات بانتظار هذه المرحلة حالياً</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function SortableQueueRow({ instance }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instance.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr ref={setNodeRef} style={style} className="border-t border-cream-3 bg-white">
            <td className="px-3 py-3 text-center text-muted cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                ⠿
            </td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                    <Link href={`/orders/${instance.order.id}`} className="text-primary font-bold hover:underline">
                        {instance.order.order_number}
                    </Link>
                    <CopyButton text={instance.order.order_number} />
                </div>
            </td>
            <td className="px-5 py-3 font-bold text-ink">{instance.order.customer_name}</td>
            <td className="px-5 py-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${instance.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-primary-pale text-primary'}`}>
                    {statusLabels[instance.status] ?? instance.status}
                </span>
            </td>
            <td className="px-5 py-3 text-muted">
                {instance.elapsed_hours !== null
                    ? `${instance.elapsed_hours} ساعة${instance.status === 'in_progress' ? ' (حتى الآن)' : ''}`
                    : '—'}
            </td>
            <td className="px-5 py-3 text-muted">
                {instance.assigned_user?.name ?? '— أي عامل مختص —'}
            </td>
        </tr>
    );
}
