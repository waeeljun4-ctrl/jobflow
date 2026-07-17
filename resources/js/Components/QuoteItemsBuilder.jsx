export const MEASUREMENT_TYPES = [
    { value: 'area', label: 'متر مربع (عرض × ارتفاع)', unit: 'م²' },
    { value: 'linear', label: 'متر طولي (بالعرض)', unit: 'م.ط' },
    { value: 'piece', label: 'بالقطعة', unit: 'قطعة' },
];

export const emptyMeasurement = () => ({ type: 'area', length_cm: '', width_cm: '', pieces: 1 });
export const emptyQuoteItem = () => ({ description: '', unit_price: '', quantity: '', notes: '', measurements: [] });

export function measurementArea(m) {
    const pieces = parseInt(m.pieces, 10) || 1;
    if (m.type === 'piece') return pieces;
    const l = parseFloat(m.length_cm) || 0;
    if (m.type === 'linear') return Math.round((l / 100) * pieces * 100) / 100;
    const w = parseFloat(m.width_cm) || 0;
    return Math.round((l * w / 10000) * pieces * 100) / 100;
}

export function measurementUnit(m) {
    return MEASUREMENT_TYPES.find(t => t.value === m.type)?.unit ?? 'م²';
}


export function quoteItemQuantity(item) {
    if (item.measurements.length > 0) {
        return Math.round(item.measurements.reduce((sum, m) => sum + measurementArea(m), 0) * 100) / 100;
    }
    return parseFloat(item.quantity) || 0;
}

export function quoteItemTotal(item) {
    return Math.round(quoteItemQuantity(item) * (parseFloat(item.unit_price) || 0) * 100) / 100;
}

export function quoteItemsGrandTotal(items) {
    return Math.round(items.reduce((sum, item) => sum + quoteItemTotal(item), 0) * 100) / 100;
}

/**
 * Reused by the standalone quote form and the order-intake page — building
 * a price quote is the same UI in both places, and the m2/linear/piece
 * calculations must stay identical wherever it's embedded.
 */
export default function QuoteItemsBuilder({ items, onChange, errors = {} }) {
    function updateItem(index, patch) {
        const next = [...items];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    }

    function addItem() {
        onChange([...items, emptyQuoteItem()]);
    }

    function removeItem(index) {
        onChange(items.filter((_, i) => i !== index));
    }

    function addMeasurement(itemIndex) {
        const next = [...items];
        next[itemIndex] = { ...next[itemIndex], measurements: [...next[itemIndex].measurements, emptyMeasurement()] };
        onChange(next);
    }

    function updateMeasurement(itemIndex, mIndex, patch) {
        const next = [...items];
        const measurements = [...next[itemIndex].measurements];
        measurements[mIndex] = { ...measurements[mIndex], ...patch };
        next[itemIndex] = { ...next[itemIndex], measurements };
        onChange(next);
    }

    function removeMeasurement(itemIndex, mIndex) {
        const next = [...items];
        next[itemIndex] = { ...next[itemIndex], measurements: next[itemIndex].measurements.filter((_, i) => i !== mIndex) };
        onChange(next);
    }

    return (
        <div className="space-y-4">
            {items.map((item, itemIndex) => (
                <div key={itemIndex} data-item-index={itemIndex} className="bg-white rounded-2xl border border-cream-3 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <p className="font-bold text-ink text-sm">بند {itemIndex + 1}</p>
                        {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(itemIndex)} className="text-red-500 text-xs font-bold hover:underline">
                                ✕ حذف البند
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <TextField label="البيان" value={item.description}
                            onChange={v => updateItem(itemIndex, { description: v })}
                            error={errors[`quote_items.${itemIndex}.description`]} />
                        <TextField label="السعر" type="number" value={item.unit_price}
                            onChange={v => updateItem(itemIndex, { unit_price: v })}
                            error={errors[`quote_items.${itemIndex}.unit_price`]} />
                        <TextField label="ملاحظات البند" value={item.notes}
                            onChange={v => updateItem(itemIndex, { notes: v })} />
                    </div>

                    <div className="bg-cream-2 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-muted">القياسات — تحسب الكمية تلقائي حسب نوع القياس</p>
                            <button type="button" onClick={() => addMeasurement(itemIndex)} className="text-primary text-xs font-bold hover:underline">
                                + إضافة قياس
                            </button>
                        </div>

                        {item.measurements.length === 0 && (
                            <p className="text-xs text-muted mb-2">ما في قياسات — الكمية بتنكتب يدوي تحت.</p>
                        )}

                        {item.measurements.map((m, mIndex) => (
                            <div key={mIndex} className="flex items-center gap-2 mb-2 flex-wrap">
                                <select value={m.type} onChange={e => updateMeasurement(itemIndex, mIndex, { type: e.target.value })}
                                    className="px-2 py-1.5 border-2 border-cream-3 rounded-lg text-xs focus:border-primary outline-none">
                                    {MEASUREMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>

                                {m.type !== 'piece' && (
                                    <input type="number" placeholder={m.type === 'area' ? 'العرض (سم)' : 'الطول (سم)'} value={m.length_cm}
                                        onChange={e => updateMeasurement(itemIndex, mIndex, { length_cm: e.target.value })}
                                        className="w-24 px-2 py-1.5 border-2 border-cream-3 rounded-lg text-xs focus:border-primary outline-none" />
                                )}
                                {m.type === 'area' && (
                                    <>
                                        <span className="text-muted text-xs">×</span>
                                        <input type="number" placeholder="الارتفاع (سم)" value={m.width_cm}
                                            onChange={e => updateMeasurement(itemIndex, mIndex, { width_cm: e.target.value })}
                                            className="w-24 px-2 py-1.5 border-2 border-cream-3 rounded-lg text-xs focus:border-primary outline-none" />
                                    </>
                                )}
                                <span className="text-muted text-xs">عدد</span>
                                <input type="number" placeholder="عدد القطع" value={m.pieces} min="1"
                                    onChange={e => updateMeasurement(itemIndex, mIndex, { pieces: e.target.value })}
                                    className="w-20 px-2 py-1.5 border-2 border-cream-3 rounded-lg text-xs focus:border-primary outline-none" />
                                <span className="text-xs font-bold text-primary mr-2">= {measurementArea(m)} {measurementUnit(m)}</span>
                                <button type="button" onClick={() => removeMeasurement(itemIndex, mIndex)} className="text-red-500 text-xs mr-auto">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-muted block mb-1">الكمية</label>
                            {item.measurements.length > 0 ? (
                                <p className="px-3 py-2 bg-cream-2 rounded-xl text-sm font-bold text-ink">{quoteItemQuantity(item)}</p>
                            ) : (
                                <input type="number" value={item.quantity}
                                    onChange={e => updateItem(itemIndex, { quantity: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
                            )}
                        </div>
                        <div className="md:col-span-2 text-left">
                            <p className="text-xs font-bold text-muted mb-1">سعر البند</p>
                            <p className="text-lg font-black text-primary">{quoteItemTotal(item)}</p>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" onClick={addItem}
                className="w-full bg-white rounded-2xl border-2 border-dashed border-cream-3 p-4 text-sm font-bold text-muted hover:border-primary hover:text-primary transition-colors">
                + إضافة بند جديد
            </button>
        </div>
    );
}

function TextField({ label, value, onChange, error, type = 'text' }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted block mb-1">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-cream-3 rounded-xl text-sm focus:border-primary outline-none" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
