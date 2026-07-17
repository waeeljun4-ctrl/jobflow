<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\SpecField;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderIntakeService
{
    public function __construct(
        private WorkflowService $workflow,
        private PhoneNumberService $phoneNumbers,
        private QuoteService $quotes,
        private ImageCompressionService $imageCompressor,
    ) {
    }

    /**
     * Create an order with its flexible specs and required conditional
     * stages, then initialize the stage graph. Shared by the web intake
     * controller and the mobile API so intake behaves identically from both
     * clients.
     *
     * @param  array{customer_name:string,customer_phone:string,customer_address:?string,notes:?string,due_date:?string,stage_definition_ids:array<int>,specs:array<int,string>,quote_items:?array,send_to_design:?bool}  $data
     */
    public function create(array $data, User $creator): Order
    {
        $activeFields = SpecField::where('is_active', true)->get()->keyBy('id');
        $this->assertRequiredSpecsPresent($activeFields, $data['specs'] ?? []);

        // Holding only makes sense when a quote is attached — without one
        // there's nothing for the customer to approve, so it always proceeds.
        // filter_var (not ===) because the value arrives as a form-submitted
        // "0"/"1" string, not a real PHP boolean.
        $sendToDesign = filter_var($data['send_to_design'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasQuote = ! empty($data['quote_items']);
        $hold = $hasQuote && ! $sendToDesign;

        return DB::transaction(function () use ($data, $creator, $activeFields, $hold, $hasQuote) {
            $customer = $this->resolveCustomer($data);

            $quoteId = null;
            if ($hasQuote) {
                $quote = $this->quotes->create([
                    'customer_name' => $data['customer_name'],
                    'customer_phone' => $data['customer_phone'],
                    'items' => $data['quote_items'],
                ], $creator);
                $quoteId = $quote->id;
            }

            $order = Order::create([
                'customer_id' => $customer->id,
                'quote_id' => $quoteId,
                'order_number' => $this->nextOrderNumber(),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_address' => $data['customer_address'] ?? null,
                'notes' => $data['notes'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'created_by' => $creator->id,
                'price' => $data['price'] ?? null,
                'deposit_amount' => $data['deposit_amount'] ?? 0,
                'deposit_payment_method' => ($data['deposit_amount'] ?? 0) > 0 ? ($data['deposit_payment_method'] ?? null) : null,
                'status' => $hold ? 'on_hold' : 'intake',
                'on_hold' => $hold,
            ]);

            $order->stageDefinitions()->sync($data['stage_definition_ids']);

            foreach ($data['specs'] ?? [] as $specFieldId => $value) {
                if (! $activeFields->has($specFieldId)) {
                    continue;
                }
                if ($value === null || $value === '') {
                    continue;
                }
                $order->specValues()->create([
                    'spec_field_id' => $specFieldId,
                    'value' => is_array($value) ? json_encode($value) : $value,
                ]);
            }

            /** @var array<int, UploadedFile> $images */
            $images = array_slice($data['images'] ?? [], 0, 10);
            foreach ($images as $image) {
                if (! $image instanceof UploadedFile) {
                    continue;
                }
                $path = $this->imageCompressor->compressAndStore($image, 'order-images');
                $order->images()->create([
                    'path' => $path,
                    'uploaded_by' => $creator->id,
                ]);
            }

            // Held orders keep their stage_definition_ids selection saved
            // above so the graph can be built later, unchanged, once the
            // admin releases them from the "pending approval" list.
            if (! $hold) {
                $this->workflow->initializeStages($order, $creator);
            }

            return $order;
        });
    }

    /**
     * Matches an existing customer by phone (normalized so formatting
     * differences don't create duplicates) or creates a new one. Never
     * silently overwrites an existing customer's saved name/address —
     * only backfills the address if it was previously empty — so a
     * one-off delivery address on a later order can't clobber their
     * real address.
     */
    private function resolveCustomer(array $data): Customer
    {
        $phone = $this->phoneNumbers->normalize($data['customer_phone']);

        $customer = Customer::firstOrNew(['phone' => $phone]);

        if (! $customer->exists) {
            $customer->name = $data['customer_name'];
            $customer->address = $data['customer_address'] ?? null;
        } elseif (empty($customer->address) && ! empty($data['customer_address'] ?? null)) {
            $customer->address = $data['customer_address'];
        }

        $customer->save();

        return $customer;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, SpecField>  $activeFields
     * @param  array<int, mixed>  $specs
     */
    private function assertRequiredSpecsPresent($activeFields, array $specs): void
    {
        $missing = $activeFields->filter(function (SpecField $field) use ($specs) {
            if (! $field->is_required) {
                return false;
            }
            $value = $specs[$field->id] ?? null;

            return $value === null || $value === '';
        });

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages(
                $missing->mapWithKeys(fn (SpecField $field) => [
                    "specs.{$field->id}" => "حقل \"{$field->label_ar}\" إلزامي.",
                ])->all()
            );
        }
    }

    /**
     * JF-YYYY-MM-NNNN — year, month, and a sequence that resets each month.
     * Only digits/letters/hyphens, so it's always safe to use directly as a
     * file name (e.g. in Illustrator) with no extra typing.
     */
    private function nextOrderNumber(): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $count = Order::withTrashed()
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count() + 1;

        return sprintf('JF-%s-%s-%04d', $year, $month, $count);
    }
}
