<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        body { font-family: tahoma; direction: rtl; color: #1a1a1a; }
        table.layout { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.layout td { vertical-align: top; border: none; padding: 0; }
        .meta { font-size: 11px; color: #444; text-align: left; }
        .meta div { margin-bottom: 3px; }
        .company-name { font-size: 18px; font-weight: bold; text-align: right; }
        .company-sub { font-size: 11px; color: #666; text-align: right; }
        .hr { border-top: 2px solid {{ $accentColor }}; margin: 10px 0 16px; }
        h1 { text-align: center; font-size: 17px; font-weight: bold; margin: 0 0 16px; color: {{ $accentColor }}; }
        .greeting { margin-bottom: 12px; font-size: 12px; }
        .greeting b { font-size: 13px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th, table.items td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; text-align: center; }
        table.items th { background: {{ $accentLight }}; font-weight: bold; }
        table.items td.desc { text-align: right; font-weight: bold; }
        .total-box { background: {{ $accentLight }}; font-weight: bold; font-size: 14px; padding: 8px 18px; display: inline-block; }
        .vat-note { font-size: 10px; color: #b02a2a; margin: 6px 0 18px; }
        .closing { font-weight: bold; margin-bottom: 24px; font-size: 12px; }
        .footer { border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #555; }
    </style>
</head>
<body>
    <table class="layout">
        <tr>
            <td width="55%">
                @if($logoPath)<img src="{{ $logoPath }}" width="{{ $logoWidth }}" height="{{ $logoHeight }}" style="margin-bottom:6px;">@endif
                <div class="company-name">{{ $company->name }}</div>
                @if($company->address)<div class="company-sub">{{ $company->address }}</div>@endif
            </td>
            <td width="45%">
                <div class="meta">
                    <div>التاريخ: {{ $quote->quote_date->format('Y/m/d') }}</div>
                    @if($quote->valid_until)
                        <div>تاريخ انتهاء الصلاحية: {{ $quote->valid_until->format('Y/m/d') }}</div>
                    @endif
                    <div>رقم العرض: {{ $quote->quote_number }}</div>
                </div>
            </td>
        </tr>
    </table>
    <div class="hr"></div>

    <h1>عرض سعر</h1>

    <div class="greeting">
        <b>السادة: {{ $quote->customer_name }}</b><br>
        تحية طيبة وبعد..<br>
        يسرنا تقديم عرض السعر التالي:
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>البيان</th>
                <th>القياس</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>السعر الإجمالي</th>
                <th>ملاحظات</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->items as $item)
                <tr>
                    <td class="desc">{{ $item->description }}</td>
                    <td>
                        @forelse($item->measurements as $m)
                            @php
                                $suffix = $m->pieces > 1 ? ' ('.$m->pieces.')' : '';
                                $trim = fn ($v) => rtrim(rtrim(number_format($v, 2), '0'), '.');
                            @endphp
                            @if($m->type === 'piece')
                                {{ $m->pieces }} قطعة
                            @elseif($m->type === 'linear')
                                {{ $trim($m->length_cm) }} سم طولي{{ $suffix }}
                            @else
                                {{ $trim($m->length_cm) }}×{{ $trim($m->width_cm) }}{{ $suffix }}
                            @endif
                            <br>
                        @empty
                            —
                        @endforelse
                    </td>
                    <td>
                        @forelse($item->measurements as $m)
                            {{ $m->area_m2 }}<br>
                        @empty
                            {{ $item->quantity }}
                        @endforelse
                    </td>
                    <td>{{ $item->unit_price }}</td>
                    <td>{{ $item->line_total }}</td>
                    <td>{{ $item->notes ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-box">المجموع الكلي: {{ $quote->total }}</div>
    <div class="vat-note">غير شامل ضريبة القيمة المضافة</div>

    @if($quote->notes)
        <div class="greeting">{{ $quote->notes }}</div>
    @endif

    <div class="closing">مع فائق الاحترام والتقدير</div>

    <div class="footer">
        @if($company->address)<div>📍 {{ $company->address }}</div>@endif
        @if($company->phone)<div>📞 {{ $company->phone }}</div>@endif
    </div>
</body>
</html>
