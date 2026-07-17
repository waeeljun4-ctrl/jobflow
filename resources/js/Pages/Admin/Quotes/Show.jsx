import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function QuoteShow({ quote }) {
    return (
        <AdminLayout title={`عرض سعر ${quote.quote_number}`}>
            <Head title={quote.quote_number} />

            <div className="mb-4 flex justify-end gap-3">
                <a href={`/admin/quotes/${quote.id}/print`} target="_blank" rel="noreferrer"
                    className="bg-white border border-cream-3 text-ink px-5 py-2.5 rounded-xl font-bold text-sm hover:border-primary transition-colors">
                    🖨️ طباعة
                </a>
                <Link href={`/admin/quotes/${quote.id}/edit`}
                    className="bg-ink text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-colors">
                    تعديل
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info label="رقم العرض" value={quote.quote_number} />
                <Info label="الزبون" value={quote.customer_name} />
                <Info label="الهاتف" value={quote.customer_phone || '—'} />
                <Info label="التاريخ" value={quote.quote_date} />
                <Info label="صالح لغاية" value={quote.valid_until || '—'} />
                <Info label="المجموع" value={quote.total} />
            </div>

            <div className="bg-white rounded-2xl border border-cream-3 overflow-hidden mb-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-right text-muted text-xs uppercase">
                            <th className="px-5 py-2">البيان</th>
                            <th className="px-5 py-2">القياسات</th>
                            <th className="px-5 py-2">الكمية</th>
                            <th className="px-5 py-2">السعر</th>
                            <th className="px-5 py-2">السعر الإجمالي</th>
                            <th className="px-5 py-2">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map(item => (
                            <tr key={item.id} className="border-t border-cream-3 align-top">
                                <td className="px-5 py-3 font-bold text-ink">{item.description}</td>
                                <td className="px-5 py-3 text-muted text-xs">
                                    {item.measurements.length === 0 ? '—' : item.measurements.map((m, i) => (
                                        <div key={i}>{formatMeasurement(m)}</div>
                                    ))}
                                </td>
                                <td className="px-5 py-3">{item.quantity}</td>
                                <td className="px-5 py-3">{item.unit_price}</td>
                                <td className="px-5 py-3 font-bold text-ink">{item.line_total}</td>
                                <td className="px-5 py-3 text-muted">{item.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {quote.notes && (
                <div className="bg-white rounded-2xl border border-cream-3 p-5">
                    <p className="text-xs font-bold text-muted mb-1">ملاحظات</p>
                    <p className="text-sm text-ink">{quote.notes}</p>
                </div>
            )}
        </AdminLayout>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-xs text-muted mb-0.5">{label}</p>
            <p className="font-bold text-ink">{value}</p>
        </div>
    );
}

function formatMeasurement(m) {
    const suffix = m.pieces > 1 ? ` (${m.pieces})` : '';
    if (m.type === 'piece') return `${m.pieces} قطعة`;
    if (m.type === 'linear') return `${m.length_cm} سم طولي${suffix}`;
    return `${m.length_cm}×${m.width_cm}${suffix}`;
}
