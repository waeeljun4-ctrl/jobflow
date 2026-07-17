<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        body { direction: rtl; color: #1a1a1a; }
        table.layout { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.layout td { vertical-align: top; border: none; padding: 0; }
        .meta { font-size: 11px; color: #444; text-align: left; }
        .meta div { margin-bottom: 3px; }
        .company-name { font-size: 18px; font-weight: bold; text-align: right; }
        .company-sub { font-size: 11px; color: #666; text-align: right; }
        .hr { border-top: 2px solid {{ $accentColor }}; margin: 10px 0 16px; }
        h1 { text-align: center; font-size: 17px; font-weight: bold; margin: 0 0 16px; color: {{ $accentColor }}; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th, table.items td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; text-align: center; }
        table.items th { background: {{ $accentLight }}; font-weight: bold; }
        table.items td.name { text-align: right; font-weight: bold; }
        .total-box { background: {{ $accentLight }}; font-weight: bold; font-size: 14px; padding: 8px 18px; display: inline-block; }
        .no-price { color: #b02a2a; }
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
                    <div>تاريخ التقرير: {{ now()->format('Y/m/d') }}</div>
                    @if($filters['from'])<div>من: {{ $filters['from'] }}</div>@endif
                    @if($filters['to'])<div>إلى: {{ $filters['to'] }}</div>@endif
                    @if($filters['search'])<div>بحث: {{ $filters['search'] }}</div>@endif
                    <div>عدد الطلبيات: {{ $orders->count() }}</div>
                </div>
            </td>
        </tr>
    </table>
    <div class="hr"></div>

    <h1>تقرير الطلبيات</h1>

    <table class="items">
        <thead>
            <tr>
                <th>رقم الطلبية</th>
                <th>العميل</th>
                <th>أنواع العمل</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>السعر</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
                <tr>
                    <td class="name">{{ $order->order_number }}</td>
                    <td>{{ $order->customer_name }}</td>
                    <td>{{ $order->stageDefinitions->pluck('name_ar')->join('، ') }}</td>
                    <td>{{ $order->status_label }}</td>
                    <td>{{ $order->created_at->format('Y/m/d') }}</td>
                    <td class="{{ $order->price ? '' : 'no-price' }}">{{ $order->price ? number_format($order->price, 2) : '—' }}</td>
                </tr>
            @endforeach
            @if($orders->isEmpty())
                <tr><td colspan="6">لا يوجد طلبيات مطابقة</td></tr>
            @endif
        </tbody>
    </table>

    <div class="total-box">المجموع الكلي: {{ number_format($total, 2) }}</div>
</body>
</html>
