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
        h2 { font-size: 13px; font-weight: bold; margin: 18px 0 8px; color: {{ $accentColor }}; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th, table.items td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; text-align: center; }
        table.items th { background: {{ $accentLight }}; font-weight: bold; }
        table.items td.name { text-align: right; font-weight: bold; }
        table.items td.orders { text-align: right; }
        .total-box { background: {{ $accentLight }}; font-weight: bold; font-size: 14px; padding: 8px 18px; display: inline-block; }
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
                    <div>العامل: {{ $worker->name }}</div>
                </div>
            </td>
        </tr>
    </table>
    <div class="hr"></div>

    <h1>سجل ساعات عمل — {{ $worker->name }}</h1>

    <h2>الملخص الشهري</h2>
    <table class="items">
        <thead>
            <tr>
                <th>الشهر</th>
                <th>مجموع الساعات</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthly as $month)
                <tr>
                    <td class="name">{{ $month['label'] }}</td>
                    <td>{{ $month['total_hours'] }} ساعة</td>
                </tr>
            @endforeach
            @if($monthly->isEmpty())
                <tr><td colspan="2">لا يوجد بيانات</td></tr>
            @endif
        </tbody>
    </table>

    <h2>السجل اليومي</h2>
    <table class="items">
        <thead>
            <tr>
                <th>التاريخ</th>
                <th>اليوم</th>
                <th>الساعات</th>
                <th>الطلبيات</th>
            </tr>
        </thead>
        <tbody>
            @foreach($daily as $day)
                <tr>
                    <td>{{ $day['date_label'] }}</td>
                    <td>{{ $day['day_name'] }}</td>
                    <td>{{ $day['total_hours'] }} ساعة</td>
                    <td class="orders">
                        @foreach($day['orders'] as $order)
                            {{ $order['order_number'] }} ({{ $order['customer_name'] }} — {{ $order['hours'] }} س){{ !$loop->last ? '، ' : '' }}
                        @endforeach
                    </td>
                </tr>
            @endforeach
            @if($daily->isEmpty())
                <tr><td colspan="4">لا يوجد بيانات</td></tr>
            @endif
        </tbody>
    </table>

    <div class="total-box">
        الإجمالي: {{ $daily->sum('total_hours') }} ساعة
    </div>
</body>
</html>
