<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Product;
use App\Models\SystemSetting;
use App\Services\PosOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class CustomerQrOrderController extends Controller
{
    public function __construct(
        protected PosOrderService $posService,
    ) {}

    /**
     * Display the digital menu for customer after scanning table QR code.
     */
    public function show(string $token): Response
    {
        $table = DiningTable::where('qr_code_token', $token)->firstOrFail();

        $products = Product::with('category')
            ->where('is_available', true)
            ->where('stock_qty', '>', 0)
            ->orderBy('category_id')
            ->orderBy('product_name')
            ->get();

        $categories = Category::orderBy('category_name')->get();

        $activeOrder = Order::where('table_id', $table->id)
            ->whereNotIn('order_status', ['served', 'cancelled'])
            ->latest()
            ->first();

        return Inertia::render('CustomerQR/Menu', [
            'table' => $table,
            'categories' => $categories,
            'products' => $products,
            'active_order' => $activeOrder,
            'pin_required' => (bool) SystemSetting::get('qr_table_pin_enabled', false),
        ]);
    }

    /**
     * Store an order placed by customer from their table.
     */
    public function store(Request $request, string $token): RedirectResponse
    {
        $table = DiningTable::where('qr_code_token', $token)->firstOrFail();

        // 1. Anti-Spam Rate Limiter (Anti-Customer Iseng Flood Attack)
        $maxAttempts = (int) SystemSetting::get('qr_rate_limit_per_minute', 3);
        $rateKey = 'qr_order:' . $request->ip() . ':' . $table->id;
        if (RateLimiter::tooManyAttempts($rateKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($rateKey);

            return redirect()->back()->with('error', "Terlalu banyak permintaan pemesanan dari perangkat ini. Mohon tunggu {$seconds} detik demi keamanan.");
        }
        RateLimiter::hit($rateKey, 120);

        // 2. Table PIN Verification if Enabled
        if (SystemSetting::get('qr_table_pin_enabled', false)) {
            $requiredPin = (string) SystemSetting::get('qr_table_pin_code', '1234');
            $enteredPin = (string) $request->input('table_pin');
            if ($enteredPin !== $requiredPin) {
                return redirect()->back()->with('error', 'Kode PIN Meja tidak valid. Silakan periksa nomor PIN yang tertera di meja Anda.');
            }
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:100'],
            'payment_method' => ['required', 'string', 'in:qris,tunai'],
            'table_pin' => ['nullable', 'string', 'max:10'],
        ]);

        $orderData = [
            'items' => $validated['items'],
            'payment_method' => $validated['payment_method'],
            'table_id' => $table->id,
            'customer_name' => $validated['customer_name'],
            'order_source' => 'qr_table',
        ];

        // Process order
        $order = $this->posService->createPosOrder($orderData, null, null);

        // Mark table occupied
        $table->update(['status' => 'occupied']);

        return redirect()->route('table.order.status', [
            'token' => $token,
            'order' => $order->id,
        ])->with('success', "Pesanan #{$order->token_number} berhasil dikirim ke kasir & dapur!");
    }

    /**
     * Display live order status for customer at their table.
     */
    public function status(string $token, Order $order): Response
    {
        $table = DiningTable::where('qr_code_token', $token)->firstOrFail();

        abort_if($order->table_id !== $table->id, 403, 'Pesanan tidak cocok dengan meja ini.');

        $order->load(['items.product', 'kitchenTickets']);

        return Inertia::render('CustomerQR/Status', [
            'table' => $table,
            'order' => $order,
        ]);
    }
}
