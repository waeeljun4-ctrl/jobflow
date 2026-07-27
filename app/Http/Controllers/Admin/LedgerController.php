<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\LedgerEntry;
use App\Models\Supplier;
use App\Models\User;
use App\Services\PdfBrandingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LedgerController extends Controller
{
    public function __construct(private PdfBrandingService $branding)
    {
    }

    public function index()
    {
        $workers = User::where('role', 'worker')
            ->with('ledgerEntries.creator:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'phone'])
            ->map(fn (User $u) => $this->partyPayload('worker', $u->id, $u->name, $u->phone, $u->ledgerEntries));

        $suppliers = Supplier::with('ledgerEntries.creator:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Supplier $s) => $this->partyPayload('supplier', $s->id, $s->name, $s->phone, $s->ledgerEntries));

        return Inertia::render('Admin/Ledger', [
            'workers' => $workers->values(),
            'suppliers' => $suppliers->values(),
        ]);
    }

    private function partyPayload(string $type, int $id, string $name, ?string $phone, $entries): array
    {
        return [
            'type' => $type,
            'id' => $id,
            'name' => $name,
            'phone' => $phone,
            'balance' => $entries->sum('amount'),
            'entries' => $entries->values(),
        ];
    }

    public function storeSupplier(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        Supplier::create($data);

        return back()->with('success', 'تمت إضافة التاجر.');
    }

    public function storeEntry(Request $request)
    {
        $data = $request->validate([
            'party_type' => 'required|in:worker,supplier',
            'party_id' => 'required|integer',
            'direction' => 'required|in:due,payment',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'entry_date' => 'nullable|date',
        ]);

        $modelClass = $data['party_type'] === 'worker' ? User::class : Supplier::class;
        $party = $modelClass::findOrFail($data['party_id']);

        $party->ledgerEntries()->create([
            'amount' => $data['direction'] === 'due' ? $data['amount'] : -$data['amount'],
            'description' => $data['description'],
            'entry_date' => $data['entry_date'] ?? now()->toDateString(),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'تم تسجيل الحركة.');
    }

    public function destroyEntry(LedgerEntry $entry)
    {
        $entry->delete();

        return back()->with('success', 'تم حذف الحركة.');
    }

    public function print(string $type)
    {
        abort_unless(in_array($type, ['workers', 'suppliers'], true), 404);

        if ($type === 'workers') {
            $rows = User::where('role', 'worker')->with('ledgerEntries')->orderBy('name')->get(['id', 'name'])
                ->map(fn (User $u) => ['name' => $u->name, 'balance' => $u->ledgerEntries->sum('amount')]);
            $title = 'تقرير حسابات العمال';
            $sectionTitle = 'العمال';
            $filename = 'ledger-workers-report.pdf';
        } else {
            $rows = Supplier::with('ledgerEntries')->orderBy('name')->get()
                ->map(fn (Supplier $s) => ['name' => $s->name, 'balance' => $s->ledgerEntries->sum('amount')]);
            $title = 'تقرير حسابات التجار';
            $sectionTitle = 'التجار';
            $filename = 'ledger-suppliers-report.pdf';
        }

        $company = CompanySetting::current();
        $logoPath = $company->logo_path && Storage::disk('public')->exists($company->logo_path)
            ? Storage::disk('public')->path($company->logo_path)
            : null;

        [$accentColor, $accentLight] = $this->branding->extractAccentColor($logoPath);
        [$logoWidth, $logoHeight] = $this->branding->fitLogoBox($logoPath);

        $html = view('ledger-print', [
            'rows' => $rows,
            'title' => $title,
            'sectionTitle' => $sectionTitle,
            'company' => $company,
            'logoPath' => $logoPath,
            'accentColor' => $accentColor,
            'accentLight' => $accentLight,
            'logoWidth' => $logoWidth,
            'logoHeight' => $logoHeight,
        ])->render();

        $mpdf = $this->branding->makePdf();
        $mpdf->SetTitle($title);
        $this->branding->applyWatermark($mpdf, $logoPath);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="'.$filename.'"');
    }
}
