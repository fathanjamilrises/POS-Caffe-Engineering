<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Display a listing of orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['shift', 'table', 'cashier', 'items.product', 'kitchenTickets']);

        if ($request->filled('order_status')) {
            $query->where('order_status', $request->input('order_status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        if ($request->filled('order_source')) {
            $query->where('order_source', $request->input('order_source'));
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->input('shift_id'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->input('table_id'));
        }

        if ($request->filled('cashier_id')) {
            $query->where('cashier_id', $request->input('cashier_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('token_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        $orders = $query->latest()->paginate(15);

        return response()->json($orders);
    }

    /**
     * Store a newly created order, create items, adjust stock, and trigger kitchen tickets.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => ['nullable', 'exists:cashier_shifts,id'],
            'table_id' => ['nullable', 'exists:dining_tables,id'],
            'cashier_id' => ['nullable', 'exists:users,id'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'order_source' => ['required', 'string', Rule::in(['qr_table', 'cashier_direct'])],
            'order_status' => ['nullable', 'string', Rule::in(['pending', 'confirmed', 'processing', 'ready', 'served'])],
            'payment_method' => ['required', 'string', Rule::in(['tunai', 'qris'])],
            'payment_status' => ['nullable', 'string', Rule::in(['unpaid', 'paid', 'refunded'])],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $todayOrdersCount = Order::whereDate('created_at', now()->toDateString())->count();
            $tokenNumber = 'A-'.str_pad((string) ($todayOrdersCount + 1), 2, '0', STR_PAD_LEFT);
            $invoiceNumber = 'INV-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4));

            $totalCost = 0;
            $totalAmount = 0;
            $itemsData = [];

            // First pass: validate products and calculate totals
            foreach ($validated['items'] as $itemInput) {
                $product = Product::lockForUpdate()->findOrFail($itemInput['product_id']);

                $unitCost = (float) $product->cost_price;
                $unitPrice = (float) $product->selling_price;
                $quantity = (int) $itemInput['quantity'];
                $subtotal = $unitPrice * $quantity;

                $totalCost += ($unitCost * $quantity);
                $totalAmount += $subtotal;

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                    'notes' => $itemInput['notes'] ?? null,
                ];
            }

            $amountReceived = isset($validated['amount_received'])
                ? (float) $validated['amount_received']
                : $totalAmount;

            $changeAmount = max(0, $amountReceived - $totalAmount);

            // Create Order
            $order = Order::create([
                'invoice_number' => $invoiceNumber,
                'token_number' => $tokenNumber,
                'shift_id' => $validated['shift_id'] ?? null,
                'table_id' => $validated['table_id'] ?? null,
                'cashier_id' => $validated['cashier_id'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'order_source' => $validated['order_source'],
                'order_status' => $validated['order_status'] ?? 'confirmed',
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'] ?? 'paid',
                'total_cost' => $totalCost,
                'total_amount' => $totalAmount,
                'amount_received' => $amountReceived,
                'change_amount' => $changeAmount,
            ]);

            // Create Order Items, Stock Movements & Kitchen Tickets
            foreach ($itemsData as $data) {
                /** @var Product $product */
                $product = $data['product'];
                $quantity = $data['quantity'];

                $requiresKitchen = (bool) $product->requires_kitchen;
                $itemStatus = $requiresKitchen ? 'queued_kds' : 'instant';

                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_cost' => $data['unit_cost'],
                    'unit_price' => $data['unit_price'],
                    'subtotal' => $data['subtotal'],
                    'notes' => $data['notes'],
                    'item_status' => $itemStatus,
                ]);

                // Reduce product stock & record movement
                $newStock = max(0, $product->stock_qty - $quantity);
                $product->update([
                    'stock_qty' => $newStock,
                    'is_available' => $newStock > 0,
                ]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $validated['cashier_id'] ?? 1,
                    'movement_type' => 'out',
                    'quantity_change' => -$quantity,
                    'notes' => "Penjualan Order #{$order->invoice_number}",
                ]);

                // If product requires kitchen, create Kitchen Ticket for KDS
                if ($requiresKitchen) {
                    KitchenTicket::create([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'token_number' => $tokenNumber,
                        'chef_id' => null,
                        'ticket_status' => 'waiting',
                        'is_audio_notified' => false,
                        'sent_to_kds_at' => now(),
                    ]);
                }
            }

            // If table assigned, mark table as occupied
            if (! empty($validated['table_id'])) {
                DiningTable::where('id', $validated['table_id'])->update(['status' => 'occupied']);
            }

            return $order;
        });

        return response()->json([
            'message' => 'Order berhasil dibuat',
            'data' => $order->load(['shift', 'table', 'cashier', 'items.product', 'kitchenTickets']),
        ], 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load(['shift', 'table', 'cashier', 'items.product', 'kitchenTickets.chef']);

        return response()->json($order);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => ['required', 'string', Rule::in(['pending', 'confirmed', 'processing', 'ready', 'served'])],
        ]);

        $order->update($validated);

        // If order served and has dining table, check if table should be released
        if ($validated['order_status'] === 'served' && $order->table_id) {
            $hasActiveOrders = Order::where('table_id', $order->table_id)
                ->where('id', '!=', $order->id)
                ->whereIn('order_status', ['pending', 'confirmed', 'processing', 'ready'])
                ->exists();

            if (! $hasActiveOrders) {
                DiningTable::where('id', $order->table_id)->update(['status' => 'available']);
            }
        }

        return response()->json([
            'message' => 'Status order berhasil diperbarui',
            'data' => $order,
        ]);
    }

    /**
     * Update payment information for an order.
     */
    public function updatePayment(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => ['sometimes', 'string', Rule::in(['tunai', 'qris'])],
            'payment_status' => ['required', 'string', Rule::in(['unpaid', 'paid', 'refunded'])],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (isset($validated['amount_received'])) {
            $validated['change_amount'] = max(0, (float) $validated['amount_received'] - (float) $order->total_amount);
        }

        $order->update($validated);

        return response()->json([
            'message' => 'Status pembayaran berhasil diperbarui',
            'data' => $order,
        ]);
    }
}
