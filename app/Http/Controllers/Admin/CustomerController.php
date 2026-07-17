<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->trim()->toString();

        $customers = Customer::withCount('orders')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('address', 'like', "%{$search}%"))
            ->orderByDesc('updated_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Customers', [
            'customers' => $customers,
            'search' => $search,
        ]);
    }

    public function show(Customer $customer)
    {
        $customer->load(['orders' => fn ($q) => $q->orderByDesc('created_at')->with('stageDefinitions')]);

        return Inertia::render('Admin/CustomerShow', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer->update($data);

        return back()->with('success', 'تم تحديث بيانات الزبون.');
    }
}
