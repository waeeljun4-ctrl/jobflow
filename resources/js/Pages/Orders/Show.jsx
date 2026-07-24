import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkerLayout from '@/Layouts/WorkerLayout';
import CopyButton from '@/Components/CopyButton';

const statusStyles = {
    locked: 'bg-gray-100 text-gray-400 border-gray-200',
    available: 'bg-primary-pale text-primary border-primary/30',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    done: 'bg-green-50 text-green-700 border-green-200',
};

const statusLabels = {
    locked: 'مقفل',
    available: 'متاح',
    in_progress: 'قيد التنفيذ',
    done: 'منتهي',
};

const paymentMethodLabels = {
    cash: 'نقدي',
    bank_transfer: 'تحويل بنكي',
    check: 'شيك',
};

export default function Show({ order, stages, canEdit }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
    const canComplete = isAdmin || (auth?.permissions ?? []).includes('order.complete');
    const Layout = isAdmin ? AdminLayout : WorkerLayout;

    function release() {
        if (! confirm(`إرسال الطلبية ${order.order_number} للتصميم؟`)) return;
        router.post(`/admin/orders/${order.id}/release`);
    }

    function markCompleted() {
        if (! confirm(`تحديد الطلبية ${order.order_number} كمكتملة رح يقفل كل مراحل العمل المتبقية عليها تلقائياً — حتى المراحل يلي ما بلشت لسا. متأكد إنك بدك تكمل؟`)) return;
        router.post(`/admin/orders/${order.id}/complete`);
    }

    return (
        <Layout title={`الطلبية ${order.order_number}`}>
            <Head title={order.order_number} />

            <div className="flex items-center gap-2 mb-4 max-w-4xl">
                <span className="text-sm text-muted">اسم الملف:</span>
                <span className="font-bold text-ink text-sm">{order.order_number}</span>
                <CopyButton text={order.order_number} />
                <div className="mr-auto flex items-center gap-2">
                    {canComplete && order.status !== 'completed' && (
                        <button onClick={markCompleted}
                            className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-colors">
                            ✅ تحديد كمكتملة
                        </button>
                    )}
                    {canEdit && (
                        <Link href={`/orders/${order.id}/edit`}
                            className="bg-primary-pale text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                            ✏️ تعديل بيانات الطلبية
                        </Link>
                    )}
                </div>
            </div>

            {isAdmin && order.on_hold && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-4 max-w-4xl flex items-center justify-between">
                    <p className="text-sm font-bold">⏳ الطلبية متوقفة بانتظار موافقة الزبون على عرض السعر — لم يبدأ التصميم بعد.</p>
                    <button onClick={release} className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary transition-colors shrink-0">
                        ابدأ التصميم
                    </button>
                </div>
            )}

            {isAdmin && order.quote && (
                <div className="bg-white border border-cream-3 rounded-2xl p-4 mb-4 max-w-4xl flex items-center justify-between">
                    <p className="text-sm text-ink">
                        مرتبطة بعرض سعر: <span className="font-bold">{order.quote.quote_number}</span> — {order.quote.total}
                    </p>
                    <a href={`/admin/quotes/${order.quote.id}/print`} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline shrink-0">
                        🖨️ عرض/طباعة
                    </a>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-cream-3 p-5">
                        <p className="font-bold text-ink text-sm mb-3">مسار الإنتاج</p>
                        <div className="space-y-2">
                            {stages.map(stage => (
                                <div key={stage.id} className={`border rounded-xl px-4 py-3 flex items-center justify-between ${statusStyles[stage.status]}`}>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {stage.stage_definition?.name_ar}
                                        </p>
                                        {stage.completed_by_user && (
                                            <p className="text-xs opacity-70 mt-0.5">
                                                أنهاها: {stage.completed_by_user.name}
                                            </p>
                                        )}
                                        {stage.status === 'in_progress' && stage.assigned_user && (
                                            <p className="text-xs opacity-70 mt-0.5">
                                                يشتغل عليها الآن: {stage.assigned_user.name}
                                            </p>
                                        )}
                                        {stage.elapsed_hours !== null && (
                                            <p className="text-xs opacity-70 mt-0.5">
                                                المدة: {stage.elapsed_hours} ساعة{stage.status === 'in_progress' ? ' (حتى الآن)' : ''}
                                            </p>
                                        )}
                                        {stage.last_send_back_reason && (
                                            <p className="text-xs text-red-600 mt-0.5">
                                                ↩ سبب آخر إرجاع: {stage.last_send_back_reason}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold shrink-0">{statusLabels[stage.status]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-cream-3 p-5">
                        <p className="font-bold text-ink text-sm mb-3">مواصفات القارمة</p>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            {order.spec_values.map(sv => (
                                <div key={sv.id}>
                                    <dt className="text-muted text-xs">{sv.spec_field?.label_ar}</dt>
                                    <dd className="font-bold text-ink">{sv.value}</dd>
                                </div>
                            ))}
                            {order.spec_values.length === 0 && <p className="text-muted text-sm">لا يوجد مواصفات مسجلة</p>}
                        </dl>
                    </div>

                    {order.images?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-cream-3 p-5">
                            <p className="font-bold text-ink text-sm mb-3">صور توضيحية ({order.images.length})</p>
                            <div className="flex flex-wrap gap-3">
                                {order.images.map(img => (
                                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                                        <img src={img.url} className="w-24 h-24 object-cover rounded-xl border border-cream-3 hover:opacity-80 transition-opacity" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-cream-3 p-5">
                        <p className="font-bold text-ink text-sm mb-3">بيانات العميل</p>
                        <dl className="space-y-2 text-sm">
                            <Info label="الاسم" value={order.customer_name} />
                            <Info label="الهاتف" value={order.customer_phone} />
                            <Info label="العنوان" value={order.customer_address} />
                            <Info label="ملاحظات" value={order.notes} />
                            <Info label="تاريخ التسليم" value={order.due_date} />
                        </dl>
                    </div>
                    <div className="bg-white rounded-2xl border border-cream-3 p-5">
                        <p className="font-bold text-ink text-sm mb-3">أنواع العمل</p>
                        <div className="flex flex-wrap gap-2">
                            {order.stage_definitions.map(s => (
                                <span key={s.id} className="px-2.5 py-1 rounded-lg bg-cream-2 text-ink text-xs font-bold">
                                    {s.name_ar}
                                </span>
                            ))}
                        </div>
                    </div>
                    {order.price !== undefined && (
                        <div className="bg-white rounded-2xl border border-cream-3 p-5">
                            <p className="font-bold text-ink text-sm mb-3">السعر والدفع</p>
                            <dl className="space-y-2 text-sm">
                                <Info label="السعر الكلي" value={order.price ? `${order.price} ₪` : null} />
                                <Info label="العربون" value={Number(order.deposit_amount) > 0 ? `${order.deposit_amount} ₪` : 'لم يُدفع'} />
                                {Number(order.deposit_amount) > 0 && (
                                    <Info label="طريقة دفع العربون" value={paymentMethodLabels[order.deposit_payment_method] ?? order.deposit_payment_method} />
                                )}
                                <Info label="المتبقي" value={order.remaining_balance !== null ? `${order.remaining_balance} ₪` : null} />
                            </dl>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

function Info({ label, value }) {
    if (!value) return null;
    return (
        <div>
            <dt className="text-muted text-xs">{label}</dt>
            <dd className="text-ink">{value}</dd>
        </div>
    );
}
