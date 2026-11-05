<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Product;
use App\Services\PosOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ]);
    }

    /**
     * Store an order placed by customer from their table.
     */
    public function store(Request $request, string $token): RedirectResponse
    {
        $table = DiningTable::where('qr_code_token', $token)->firstOrFail();

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:100'],
            'payment_method' => ['required', 'string', 'in:qris,tunai'],
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
