<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashierPosController;
use App\Http\Controllers\CustomerQrOrderController;
use App\Http\Controllers\KitchenKdsController;
use App\Http\Controllers\TableManagementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes - Kasir POS & QR System
|--------------------------------------------------------------------------
*/

// Promotional Landing Page (Public)
Route::get('/', function (Request $request) {
    if (Auth::check() && ! $request->has('preview')) {
        $user = Auth::user();

        return match ($user->role) {
            'kasir' => redirect()->route('cashier.pos'),
            'dapur' => redirect()->route('kitchen.display'),
            default => redirect()->route('admin.dashboard'),
        };
    }

    $sampleTable = \App\Models\DiningTable::where('status', 'available')->first()
        ?: \App\Models\DiningTable::first();

    return Inertia::render('Welcome', [
        'sample_table_token' => $sampleTable?->qr_code_token,
        'sample_table_number' => $sampleTable?->table_number,
    ]);
})->name('welcome');

Route::get('/welcome', function () {
    $sampleTable = \App\Models\DiningTable::where('status', 'available')->first()
        ?: \App\Models\DiningTable::first();

    return Inertia::render('Welcome', [
        'sample_table_token' => $sampleTable?->qr_code_token,
        'sample_table_number' => $sampleTable?->table_number,
    ]);
})->name('welcome.preview');

// Authentication Routes (Guest Only)
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
});

Route::post('/logout', [AuthController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// Error Page Preview / Standalone
Route::get('/error', function (Request $request) {
    $status = (int) $request->input('status', 404);

    return Inertia::render('Error', [
        'status' => $status,
        'message' => $request->input('message'),
    ]);
})->name('error.page');

// Customer QR Table Ordering (Public - Accessible via Table QR Scan)
Route::prefix('table/{token}')->name('table.')->group(function (): void {
    Route::get('/', [CustomerQrOrderController::class, 'show'])->name('menu');
    Route::post('/order', [CustomerQrOrderController::class, 'store'])->name('order.store');
    Route::get('/status/{order}', [CustomerQrOrderController::class, 'status'])->name('order.status');
});

// Authenticated Routes
Route::middleware('auth')->group(function (): void {
    // Root redirect based on role
    Route::get('/home', function () {
        $user = Auth::user();

        return match ($user->role) {
            'kasir' => redirect()->route('cashier.pos'),
            'dapur' => redirect()->route('kitchen.display'),
            default => redirect()->route('admin.dashboard'),
        };
    })->name('home');

    // Admin Suite (Requires Admin Role)
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function (): void {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Products & Inventory Management
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
        Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/products/stock-adjustments', [AdminProductController::class, 'adjustStock'])->name('products.stock.adjust');
        Route::post('/products/check-barcode', [AdminProductController::class, 'checkBarcode'])->name('products.check-barcode');

        // Legacy / Quick Actions Compatibility
        Route::post('/stock-adjustments', [AdminProductController::class, 'adjustStock'])->name('stock.adjust');
        Route::post('/categories', [AdminDashboardController::class, 'storeCategory'])->name('categories.store');
        Route::patch('/tables/{diningTable}/status', [AdminDashboardController::class, 'updateTableStatus'])->name('tables.status');

        // Users & Staff Management
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
        Route::patch('/users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');

        // Aliases & Redirects to Prevent 404s
        Route::get('/tables', fn () => redirect()->route('tables.index'))->name('tables.redirect');
        Route::get('/pos', fn () => redirect()->route('cashier.pos'))->name('pos.redirect');
        Route::get('/kitchen', fn () => redirect()->route('kitchen.display'))->name('kitchen.redirect');

        // Exports
        Route::get('/export/excel', [AdminDashboardController::class, 'exportExcel'])->name('export.excel');
        Route::get('/export/pdf', [AdminDashboardController::class, 'exportPdf'])->name('export.pdf');

        // System Settings, Health & Maintenance
        Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/security', [AdminSettingsController::class, 'updateSecurity'])->name('settings.security');
        Route::post('/settings/maintenance', [AdminSettingsController::class, 'toggleMaintenance'])->name('settings.maintenance');
        Route::post('/settings/artisan', [AdminSettingsController::class, 'runArtisan'])->name('settings.artisan');
        Route::post('/settings/clear-logs', [AdminSettingsController::class, 'clearLogs'])->name('settings.clear-logs');
        Route::post('/settings/regenerate-all-qr', [AdminSettingsController::class, 'regenerateAllQr'])->name('settings.regenerate-all-qr');
    });

    // Kasir POS Suite (Cashier Access Only)
    Route::prefix('pos')->name('cashier.')->middleware('role:kasir')->group(function (): void {
        Route::get('/', [CashierPosController::class, 'index'])->name('pos');
        Route::post('/shift/open', [CashierPosController::class, 'openShift'])->name('shift.open');
        Route::post('/shift/{shift}/close', [CashierPosController::class, 'closeShift'])->name('shift.close');
        Route::post('/checkout', [CashierPosController::class, 'checkout'])->name('checkout');
        Route::post('/orders/{order}/serve', [CashierPosController::class, 'serveOrder'])->name('order.serve');
    });

    // Meja & QR Ordering Suite (Admin & Cashier Access)
    Route::prefix('tables')->name('tables.')->middleware('role:admin,kasir')->group(function (): void {
        Route::get('/', [TableManagementController::class, 'index'])->name('index');
        Route::post('/', [TableManagementController::class, 'store'])->name('store');
        Route::patch('/{diningTable}/status', [TableManagementController::class, 'updateStatus'])->name('status');
        Route::post('/{diningTable}/regenerate-qr', [TableManagementController::class, 'regenerateQr'])->name('regenerate');
        Route::delete('/{diningTable}', [TableManagementController::class, 'destroy'])->name('destroy');
    });

    // Dapur KDS Suite (Kitchen Staff Access Only)
    Route::prefix('kitchen')->name('kitchen.')->middleware('role:dapur')->group(function (): void {
        Route::get('/', [KitchenKdsController::class, 'index'])->name('display');
        Route::post('/tickets/{ticket}/status', [KitchenKdsController::class, 'updateStatus'])->name('ticket.status');
        Route::post('/acknowledge-audio', [KitchenKdsController::class, 'acknowledgeAudio'])->name('acknowledge.audio');
    });
});
