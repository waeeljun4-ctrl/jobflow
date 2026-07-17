<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Services\PdfBrandingService;
use App\Services\QuoteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuoteController extends Controller
{
    public function __construct(private QuoteService $quotes, private PdfBrandingService $branding)
    {
    }

    public function index()
    {
        $quotes = Quote::with('items')->orderByDesc('created_at')->get()
            ->map(fn (Quote $quote) => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'customer_name' => $quote->customer_name,
                'quote_date' => $quote->quote_date->format('Y-m-d'),
                'valid_until' => optional($quote->valid_until)->format('Y-m-d'),
                'total' => $quote->total,
            ]);

        return Inertia::render('Admin/Quotes/Index', ['quotes' => $quotes]);
    }

    public function create()
    {
        return Inertia::render('Admin/Quotes/Form');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $quote = $this->quotes->create($data, $request->user());

        return redirect()->route('admin.quotes.show', $quote)->with('success', 'تم إنشاء عرض السعر.');
    }

    public function show(Quote $quote)
    {
        $quote->load(['items.measurements', 'creator']);

        return Inertia::render('Admin/Quotes/Show', ['quote' => $this->serialize($quote)]);
    }

    public function edit(Quote $quote)
    {
        $quote->load('items.measurements');

        return Inertia::render('Admin/Quotes/Form', ['quote' => $this->serialize($quote)]);
    }

    public function update(Request $request, Quote $quote)
    {
        $data = $this->validateData($request);
        $this->quotes->update($quote, $data);

        return redirect()->route('admin.quotes.show', $quote)->with('success', 'تم تحديث عرض السعر.');
    }

    public function destroy(Quote $quote)
    {
        $quote->delete();

        return redirect()->route('admin.quotes.index')->with('success', 'تم حذف عرض السعر.');
    }

    /**
     * Real, server-generated PDF (not a browser "print this page" dialog)
     * so it renders identically everywhere and can be saved/emailed as an
     * actual file. Branding (font/accent color/watermark) is shared with
     * every other generated PDF via PdfBrandingService.
     */
    public function print(Quote $quote)
    {
        $quote->load('items.measurements');
        $company = CompanySetting::current();

        $logoPath = $company->logo_path && Storage::disk('public')->exists($company->logo_path)
            ? Storage::disk('public')->path($company->logo_path)
            : null;

        [$accentColor, $accentLight] = $this->branding->extractAccentColor($logoPath);
        [$logoWidth, $logoHeight] = $this->branding->fitLogoBox($logoPath);

        $html = view('quote-print', [
            'quote' => $quote,
            'company' => $company,
            'logoPath' => $logoPath,
            'accentColor' => $accentColor,
            'accentLight' => $accentLight,
            'logoWidth' => $logoWidth,
            'logoHeight' => $logoHeight,
        ])->render();

        $mpdf = $this->branding->makePdf();
        $mpdf->SetTitle("عرض سعر {$quote->quote_number}");
        $this->branding->applyWatermark($mpdf, $logoPath);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "inline; filename=\"quote-{$quote->quote_number}.pdf\"");
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'quote_date' => 'nullable|date',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.measurements' => 'nullable|array',
            'items.*.measurements.*.type' => 'nullable|in:area,linear,piece',
            'items.*.measurements.*.length_cm' => 'nullable|numeric|min:0.1',
            'items.*.measurements.*.width_cm' => 'nullable|numeric|min:0.1',
            'items.*.measurements.*.pieces' => 'nullable|integer|min:1',
        ]);
    }

    private function serialize(Quote $quote): array
    {
        return [
            'id' => $quote->id,
            'quote_number' => $quote->quote_number,
            'customer_name' => $quote->customer_name,
            'customer_phone' => $quote->customer_phone,
            'quote_date' => $quote->quote_date->format('Y-m-d'),
            'valid_until' => optional($quote->valid_until)->format('Y-m-d'),
            'notes' => $quote->notes,
            'total' => $quote->total,
            'items' => $quote->items->map(fn (QuoteItem $item) => [
                'id' => $item->id,
                'description' => $item->description,
                'unit_price' => (float) $item->unit_price,
                'quantity' => (float) $item->quantity,
                'line_total' => (float) $item->line_total,
                'notes' => $item->notes,
                'measurements' => $item->measurements->map(fn ($m) => [
                    'type' => $m->type,
                    'length_cm' => $m->length_cm !== null ? (float) $m->length_cm : null,
                    'width_cm' => $m->width_cm !== null ? (float) $m->width_cm : null,
                    'pieces' => $m->pieces,
                    'area_m2' => (float) $m->area_m2,
                ]),
            ]),
        ];
    }
}
