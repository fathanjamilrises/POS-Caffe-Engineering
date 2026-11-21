<?php

namespace App\Http\Controllers;

use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Order;
use App\Services\PosOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashierPosController extends Controller
{
    public function __construct(
        protected PosOrderService $posService,
    ) {}

    /**
     * Display public interactive demo POS Cashier interface without authentication.
     */
    public function demo(Request $request): Response
    {
        $products = $this->posService->getPosProducts();
        $categories = Category::orderBy('category_name')->get();
        $diningTables = $this->posService->getDiningTables();

        return Inertia::render('Cashier/DemoPos', [
            'products' => $products,
            'categories' => $categories,
            'dining_tables' => $diningTables,
        ]);
    }

    /**
     * Display POS Cashier interface.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeShift = $this->posService->getActiveShift($user->id);
        $products = $this->posService->getPosProducts();
        $categories = Category::orderBy('category_name')->get();
        $diningTables = $this->posService->getDiningTables();
        $fulfillmentOrders = $this->posService->getFulfillmentOrders();
        $pendingQrOrders = $this->posService->getPendingQrOrders();
        $recentTransactions = $this->posService->getRecentTransactions($activeShift?->id);

        return Inertia::render('Cashier/Pos', [
            'active_shift' => $activeShift,
            'products' => $products,
            'categories' => $categories,
            'dining_tables' => $diningTables,
            'fulfillment_orders' => $fulfillmentOrders,
            'pending_qr_orders' => $pendingQrOrders,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    /**
     * Open a new shift session for cashier.
     */
    public function openShift(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shift_name' => ['required', 'string', 'max:50'],
            'opening_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $this->posService->openShift(
            $request->user()->id,
            $validated['shift_name'],
            (float) $validated['opening_cash'],
            $validated['notes'] ?? null
        );

        return redirect()->back()->with('success', 'Sesi shift kasir berhasil dibuka.');
    }

    /**
     * Close an active shift session and record actual cash.
     */
    public function closeShift(Request $request, CashierShift $shift): RedirectResponse
    {
        $validated = $request->validate([
            'closing_cash_actual' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $this->posService->closeShift(
            $shift->id,
            (float) $validated['closing_cash_actual'],
            $validated['notes'] ?? null
        );

        return redirect()->back()->with('success', 'Sesi shift kasir berhasil ditutup.');
    }

    /**
     * Checkout and process a cashier order.
     */
    public function checkout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['required', 'string', 'in:tunai,qris'],
            'amount_received' => ['required', 'numeric', 'min:0'],
            'table_id' => ['required_if:order_source,qr_table', 'nullable', 'exists:dining_tables,id'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'order_source' => ['required', 'string', 'in:cashier_direct,qr_table'],
        ]);

        $shift = $this->posService->getActiveShift($request->user()->id);

        $order = $this->posService->createPosOrder(
            $validated,
            $request->user()->id,
            $shift?->id
        );

        $changeFormatted = 'Rp '.number_format((float) $order->change_amount, 0, ',', '.');

        return redirect()->back()->with(
            'success',
            "Pesanan #{$order->token_number} berhasil diproses! Kembalian: {$changeFormatted}"
        );
    }

    /**
     * Mark an order as served to customer (Fulfillment Handshake).
     */
    public function serveOrder(Order $order): RedirectResponse
    {
        $this->posService->markOrderServed($order->id);

        return redirect()->back()->with('success', "Pesanan #{$order->token_number} telah diserahkan (Selesai).");
    }

    /**
     * Confirm payment for a pending QR table order and dispatch tickets to kitchen KDS.
     */
    public function confirmQrPayment(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:tunai,qris'],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        $activeShift = $this->posService->getActiveShift($user->id);

        $this->posService->confirmQrOrderPayment(
            $order->id,
            $user->id,
            $activeShift?->id,
            $validated['payment_method'],
            (float) ($validated['amount_received'] ?? 0)
        );

        return redirect()->back()->with(
            'success',
            "Pesanan Meja #{$order->token_number} berhasil dikonfirmasi! Tiket diteruskan ke dapur koki."
        );
    }

    /**
     * Cancel or reject a pending QR table order and return stock.
     */
    public function cancelOrder(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $this->posService->cancelQrOrder(
            $order->id,
            $validated['reason'] ?? 'Dibatalkan oleh kasir'
        );

        return redirect()->back()->with(
            'success',
            "Pesanan #{$order->token_number} berhasil dibatalkan dan stok dikembalikan ke etalase."
        );
    }
}
