import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function computeSortOrders(items, parallelWithPrev) {
    let level = 10;
    return items.map((item, idx) => {
        if (idx > 0) {
            level = parallelWithPrev.has(item.id) ? level : level + 10;
        }
        return { ...item, sort_order: level };
    });
}

function derivedParallelSet(items) {
    const set = new Set();
    for (let i = 1; i < items.length; i++) {
        if (items[i].sort_order === items[i - 1].sort_order) set.add(items[i].id);
    }
    return set;
}

export default function Stages({ stages: initialStages }) {
    const intake = initialStages.find(s => s.is_intake);
    const [items, setItems] = useState(() => initialStages.filter(s => !s.is_intake));
    const [parallelWithPrev, setParallelWithPrev] = useState(() => derivedParallelSet(items));

    useEffect(() => {
        const fresh = initialStages.filter(s => !s.is_intake);
        setItems(fresh);
        setParallelWithPrev(derivedParallelSet(fresh));
    }, [initialStages]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        is_conditional: true,
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/stages', { onSuccess: () => reset('name_ar', 'name_en') });
    }

    const displayItems = computeSortOrders(items, parallelWithPrev);

    function persist(newItems, newParallelSet) {
        const withOrders = computeSortOrders(newItems, newParallelSet);
        router.put('/admin/stages/reorder', {
            stages: withOrders.map(s => ({ id: s.id, sort_order: s.sort_order })),
        }, { preserveScroll: true, preserveState: true });
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        // Moving a stage resets its parallel link — the admin re-links it
        // explicitly if it should still run alongside its new neighbor.
        const newParallelSet = new Set(parallelWithPrev);
        newParallelSet.delete(active.id);

        setItems(reordered);
        setParallelWithPrev(newParallelSet);
        persist(reordered, newParallelSet);
    }

    function toggleParallel(stageId) {
        const newSet = new Set(parallelWithPrev);
        if (newSet.has(stageId)) {
            newSet.delete(stageId);
        } else {
            newSet.add(stageId);
        }
        setParallelWithPrev(newSet);
        persist(items, newSet);
    }

    function updateField(stage, field, value) {
        router.put(`/admin/stages/${stage.id}`, {
            name_ar: stage.name_ar,
            name_en: stage.name_en,
            sort_order: stage.sort_order,
            is_conditional: stage.is_conditional,
            is_active: stage.is_active,
            [field]: value,
        }, { preserveScroll: true });
    }

    function destroy(stage) {
        if (confirm(`حذف "${stage.name_ar}"؟`)) {
            router.delete(`/admin/stages/${stage.id}`, { preserveScroll: true });
        }
    }

    return (
        <AdminLayout title="المراحل والأعمال">
            <Head title="المراحل والأعمال" />

            <p className="text-sm text-muted mb-4 max-w-2xl">
                اسحب أي مرحلة من المقبض ⠿ لترتيبها. المراحل المرتبطة ببعضها (زر "🔗 متوازية مع السابقة") تعمل بنفس الوقت — مثل قص CNC وفريم الحديد اللذين يتمّان معاً بعد التصميم.
                "شرطي" تعني أن هذه المرحلة تظهر فقط إذا اختارها من يستلم الطلبية، و"دائم" تعني أنها تُضاف لكل طلبية تلقائياً.
            </p>

            <form onSubmit={submit} className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs font-bold text-muted block mb-1">اسم المرحلة</label>
                    <input value={data.name_ar} onChange={e => setData('name_ar', e.target.value)}
                        className="px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                    {errors.name_ar && <p className="text-red-500 text-xs mt-1">{errors.name_ar}</p>}
                </div>
                <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
                    <input type="checkbox" checked={data.is_conditional} onChange={e => setData('is_conditional', e.target.checked)}
                        className="accent-primary w-4 h-4" />
                    <span className="text-sm text-muted">شرطي (يُختار عند الاستلام)</span>
                </label>
                <button disabled={processing} className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    + إضافة مرحلة (تُضاف بآخر الترتيب)
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-3 py-2 w-8"></th>
                            <th className="px-5 py-2">الاسم</th>
                            <th className="px-5 py-2">الترابط</th>
                            <th className="px-5 py-2">النوع</th>
                            <th className="px-5 py-2">الحالة</th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {intake && (
                            <tr className="border-t border-cream-3 bg-cream">
                                <td></td>
                                <td className="px-5 py-3 font-bold text-ink">
                                    {intake.name_ar}
                                    <span className="ml-2 text-xs text-muted font-normal">(استلام الطلبية — دائماً أول مرحلة)</span>
                                </td>
                                <td className="px-5 py-3 text-muted text-xs">—</td>
                                <td className="px-5 py-3 text-muted text-xs">—</td>
                                <td className="px-5 py-3">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">مفعّل</span>
                                </td>
                                <td></td>
                            </tr>
                        )}

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={displayItems.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {displayItems.map((stage, idx) => (
                                    <SortableRow key={stage.id} stage={stage} isFirst={idx === 0}
                                        isParallel={parallelWithPrev.has(stage.id)}
                                        newGroup={idx > 0 && displayItems[idx - 1].sort_order !== stage.sort_order}
                                        onToggleParallel={() => toggleParallel(stage.id)}
                                        onUpdateField={updateField}
                                        onDestroy={destroy} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function SortableRow({ stage, isFirst, isParallel, newGroup, onToggleParallel, onUpdateField, onDestroy }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr ref={setNodeRef} style={style}
            className={`border-t ${newGroup ? 'border-t-4 border-t-cream-2' : ''} border-cream-3 bg-white`}>
            <td className="px-3 py-3 text-center text-muted cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                ⠿
            </td>
            <td className="px-5 py-3 font-bold text-ink">{stage.name_ar}</td>
            <td className="px-5 py-3">
                {isFirst ? (
                    <span className="text-muted text-xs">—</span>
                ) : (
                    <button onClick={onToggleParallel}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isParallel ? 'bg-primary text-white' : 'bg-cream-2 text-muted'}`}>
                        {isParallel ? '🔗 متوازية مع السابقة' : 'بعد السابقة'}
                    </button>
                )}
            </td>
            <td className="px-5 py-3">
                <button onClick={() => onUpdateField(stage, 'is_conditional', !stage.is_conditional)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${stage.is_conditional ? 'bg-amber-100 text-amber-700' : 'bg-primary-pale text-primary'}`}>
                    {stage.is_conditional ? 'شرطي' : 'دائم'}
                </button>
            </td>
            <td className="px-5 py-3">
                <button onClick={() => onUpdateField(stage, 'is_active', !stage.is_active)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${stage.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {stage.is_active ? 'مفعّل' : 'معطّل'}
                </button>
            </td>
            <td className="px-5 py-3 text-left">
                <button onClick={() => onDestroy(stage)} className="text-red-500 hover:underline text-xs">حذف</button>
            </td>
        </tr>
    );
}
