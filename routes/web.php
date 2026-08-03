<?php

use App\Http\Controllers\Admin\CompanySettingController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExecutionController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\LedgerController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PausedController;
use App\Http\Controllers\Admin\QuoteController;
use App\Http\Controllers\Admin\WorkerHoursController;
use App\Http\Controllers\Admin\SpecFieldController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StageDefinitionController;
use App\Http\Controllers\Admin\UserPermissionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController as HomeDashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderIntakeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// ── LEGAL (public, no auth — required by app store review) ──
Route::view('/privacy', 'legal.privacy')->name('privacy');
Route::view('/terms', 'legal.terms')->name('terms');

// ── AUTH ──
Route::get('/login', [AuthController::class, 'showLogin'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// ── HOME (role-based redirect) ──
Route::middleware('auth')->group(function () {
    Route::get('/', [HomeDashboardController::class, 'index'])->name('dashboard');
});

// ── ADMIN (strictly admin-only — never grantable to workers) ──
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');

    Route::get('/users/{user}/permissions', [UserPermissionController::class, 'edit'])->name('users.permissions.edit');
    Route::put('/users/{user}/permissions', [UserPermissionController::class, 'update'])->name('users.permissions.update');
    Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'start'])->name('users.impersonate');

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');

    Route::get('/settings/company', [CompanySettingController::class, 'edit'])->name('settings.company.edit');
    Route::post('/settings/company', [CompanySettingController::class, 'update'])->name('settings.company.update');

    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy'])->name('orders.destroy');
    Route::get('/orders/trash', [AdminOrderController::class, 'trashed'])->name('orders.trash');
    Route::post('/orders/{order}/restore', [AdminOrderController::class, 'restore'])->name('orders.restore')->withTrashed();
    Route::get('/orders/print', [AdminOrderController::class, 'printList'])->name('orders.print');
});

// ── ADMIN SECTIONS (permission-grantable — admin can hand any of these
// to a specific worker via /admin/users/{id}/permissions, same URLs/route
// names as before so nothing else in the app needs to change) ──
Route::middleware(['auth', 'permission:order.complete'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/orders/{order}/complete', [AdminOrderController::class, 'complete'])->name('orders.complete');
});
Route::middleware(['auth', 'permission:page.dashboard'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth', 'permission:page.execution'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/execution', [ExecutionController::class, 'index'])->name('execution');
});

Route::middleware(['auth', 'permission:page.paused'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/paused', [PausedController::class, 'index'])->name('paused.index');
    Route::post('/paused/{stageInstance}/resume', [PausedController::class, 'resume'])->name('paused.resume');
});

Route::middleware(['auth', 'permission:page.worker_hours'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/worker-hours', [WorkerHoursController::class, 'index'])->name('workerHours.index');
    Route::get('/worker-hours/{user}', [WorkerHoursController::class, 'show'])->name('workerHours.show');
    Route::get('/worker-hours/{user}/print', [WorkerHoursController::class, 'print'])->name('workerHours.print');
});

Route::middleware(['auth', 'permission:page.stages'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/stages', [StageDefinitionController::class, 'index'])->name('stages.index');
    Route::post('/stages', [StageDefinitionController::class, 'store'])->name('stages.store');
    Route::put('/stages/reorder', [StageDefinitionController::class, 'reorder'])->name('stages.reorder');
    Route::get('/stages/{stage}/queue', [StageDefinitionController::class, 'queue'])->name('stages.queue');
    Route::put('/stages/{stage}/queue/reorder', [StageDefinitionController::class, 'reorderQueue'])->name('stages.queue.reorder');
    Route::put('/stages/{stage}', [StageDefinitionController::class, 'update'])->name('stages.update');
    Route::delete('/stages/{stage}', [StageDefinitionController::class, 'destroy'])->name('stages.destroy');
});

Route::middleware(['auth', 'permission:page.spec_fields'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/spec-fields', [SpecFieldController::class, 'index'])->name('spec-fields.index');
    Route::post('/spec-fields', [SpecFieldController::class, 'store'])->name('spec-fields.store');
    Route::put('/spec-fields/{specField}', [SpecFieldController::class, 'update'])->name('spec-fields.update');
    Route::delete('/spec-fields/{specField}', [SpecFieldController::class, 'destroy'])->name('spec-fields.destroy');
});

Route::middleware(['auth', 'permission:page.orders'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
});

Route::middleware(['auth', 'permission:page.orders_pending'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/orders/pending', [AdminOrderController::class, 'pending'])->name('orders.pending');
    Route::post('/orders/{order}/release', [AdminOrderController::class, 'release'])->name('orders.release');
});

Route::middleware(['auth', 'permission:page.quotes'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/quotes', [QuoteController::class, 'index'])->name('quotes.index');
    Route::get('/quotes/create', [QuoteController::class, 'create'])->name('quotes.create');
    Route::post('/quotes', [QuoteController::class, 'store'])->name('quotes.store');
    Route::get('/quotes/{quote}', [QuoteController::class, 'show'])->name('quotes.show');
    Route::get('/quotes/{quote}/edit', [QuoteController::class, 'edit'])->name('quotes.edit');
    Route::put('/quotes/{quote}', [QuoteController::class, 'update'])->name('quotes.update');
    Route::delete('/quotes/{quote}', [QuoteController::class, 'destroy'])->name('quotes.destroy');
    Route::get('/quotes/{quote}/print', [QuoteController::class, 'print'])->name('quotes.print');
});

Route::middleware(['auth', 'permission:page.inventory'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::put('/inventory/{inventoryItem}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::post('/inventory/{inventoryItem}/adjust', [InventoryController::class, 'adjustQuantity'])->name('inventory.adjust');
    Route::delete('/inventory/{inventoryItem}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
});

Route::middleware(['auth', 'permission:page.expenses'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('/expenses/print', [ExpenseController::class, 'print'])->name('expenses.print');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

Route::middleware(['auth', 'permission:page.ledger'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/ledger', [LedgerController::class, 'index'])->name('ledger.index');
    Route::get('/ledger/print/{type}', [LedgerController::class, 'print'])->name('ledger.print');
    Route::post('/ledger/suppliers', [LedgerController::class, 'storeSupplier'])->name('ledger.suppliers.store');
    Route::post('/ledger/entries', [LedgerController::class, 'storeEntry'])->name('ledger.entries.store');
    Route::delete('/ledger/entries/{entry}', [LedgerController::class, 'destroyEntry'])->name('ledger.entries.destroy');
});

Route::middleware('auth')->post('/stop-impersonating', [ImpersonationController::class, 'stop'])->name('impersonate.stop');

// ── PROFILE (any authenticated user) ──
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'updateInfo'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.updatePassword');
});

// ── PUSH NOTIFICATIONS (browser) ──
Route::get('/push/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey'])->name('push.vapidKey');
Route::middleware('auth')->group(function () {
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push.store');
    Route::delete('/push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push.destroy');
});

// ── INTAKE (permission-driven, not admin-only) ──
Route::middleware(['auth', 'permission:stage.intake'])->prefix('intake')->name('intake.')->group(function () {
    Route::get('/', [OrderIntakeController::class, 'create'])->name('create');
    Route::post('/', [OrderIntakeController::class, 'store'])->name('store');
});

// ── MY TASKS (worker) ──
Route::middleware('auth')->prefix('my')->name('my.')->group(function () {
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks');
    Route::post('/tasks/{stageInstance}/start', [TaskController::class, 'start'])->name('tasks.start');
    Route::post('/tasks/{stageInstance}/complete', [TaskController::class, 'complete'])->name('tasks.complete');
    Route::post('/tasks/{stageInstance}/send-back', [TaskController::class, 'sendBack'])->name('tasks.sendBack');
    Route::post('/tasks/{stageInstance}/pause', [TaskController::class, 'pause'])->name('tasks.pause');
    Route::post('/tasks/{stageInstance}/resume', [TaskController::class, 'resume'])->name('tasks.resume');
    Route::post('/end-shift', [TaskController::class, 'endShift'])->name('endShift');
    Route::post('/start-shift', [TaskController::class, 'startShift'])->name('startShift');
});

// ── ORDER DETAIL (policy-gated, shared by admin + workers) ──
Route::middleware('auth')->get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
Route::middleware('auth')->get('/orders/{order}/edit', [OrderController::class, 'edit'])->name('orders.edit');
Route::middleware('auth')->put('/orders/{order}', [OrderController::class, 'update'])->name('orders.update');
Route::middleware('auth')->put('/orders/{order}/stages', [OrderController::class, 'updateStages'])->name('orders.updateStages');
