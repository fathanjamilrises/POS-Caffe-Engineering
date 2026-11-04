<?php

use App\Http\Controllers\CashierShiftController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DiningTableController;
use App\Http\Controllers\KitchenTicketController;
use App\Http\Controllers\OperationalExpenseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - POS & Kasir System
|--------------------------------------------------------------------------
*/

// Users & Staff Management
Route::apiResource('users', UserController::class);

// Categories
Route::apiResource('categories', CategoryController::class);

// Dining Tables (QR Table & Dine-in)
Route::post('dining-tables/{diningTable}/regenerate-qr', [DiningTableController::class, 'regenerateQrToken']);
Route::apiResource('dining-tables', DiningTableController::class);

// Cashier Shifts
Route::post('cashier-shifts/{cashierShift}/close', [CashierShiftController::class, 'closeShift']);
Route::apiResource('cashier-shifts', CashierShiftController::class)->only(['index', 'store', 'show']);

// Products & Barcode Scanning
Route::get('products/scan-barcode', [ProductController::class, 'scanBarcode']);
Route::apiResource('products', ProductController::class);

// Stock Movements
Route::apiResource('stock-movements', StockMovementController::class)->only(['index', 'store', 'show']);

// Orders
Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
Route::patch('orders/{order}/payment', [OrderController::class, 'updatePayment']);
Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);

// Order Items
Route::patch('order-items/{orderItem}/status', [OrderItemController::class, 'updateStatus']);
Route::apiResource('order-items', OrderItemController::class)->only(['index', 'show']);

// Kitchen Tickets & KDS
Route::patch('kitchen-tickets/{kitchenTicket}/status', [KitchenTicketController::class, 'updateStatus']);
Route::post('kitchen-tickets/{kitchenTicket}/audio-notified', [KitchenTicketController::class, 'markAudioNotified']);
Route::apiResource('kitchen-tickets', KitchenTicketController::class)->only(['index', 'show']);

// Operational Expenses & Profit/Loss Recap
Route::get('operational-expenses/summary', [OperationalExpenseController::class, 'summary']);
Route::apiResource('operational-expenses', OperationalExpenseController::class);
