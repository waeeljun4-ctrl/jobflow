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
        .due { color: #b02a2a; font-weight: bold; }
        .credit { color: #1a7a3a; font-weight: bold; }
        .balanced { color: #888; }
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
                </div>
            </td>
        </tr>
    </table>
    <div class="hr"></div>

    <h1>{{ $title }}</h1>

    <h2>{{ $sectionTitle }}</h2>
    <table class="items">
        <thead>
            <tr>
                <th>الاسم</th>
                <th>الرصيد</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    <td class="name">{{ $row['name'] }}</td>
                    <td class="{{ $row['balance'] > 0 ? 'due' : ($row['balance'] < 0 ? 'credit' : 'balanced') }}">
                        @if($row['balance'] > 0) عليك له {{ number_format($row['balance'], 2) }}
                        @elseif($row['balance'] < 0) إلك عنده {{ number_format(abs($row['balance']), 2) }}
                        @else متوازن @endif
                    </td>
                </tr>
            @endforeach
            @if($rows->isEmpty())
                <tr><td colspan="2">لا يوجد بيانات</td></tr>
            @endif
        </tbody>
    </table>
</body>
</html>
