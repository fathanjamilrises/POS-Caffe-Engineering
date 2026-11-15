<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosOrderService
{
    /**
     * Retrieve the active shift for the cashier.
     */
    public function getActiveShift(int $cashierId): ?CashierShift
    {
        return CashierShift::query()
            ->where('cashier_id', $cashierId)
            ->whereNull('closed_at')
            ->latest('opened_at')
            ->first();
    }

    /**
     * Open a new cashier shift session.
     */
    public function openShift(int $cashierId, string $shiftName, float $openingCash, ?string $notes = null): CashierShift
    {
        // Close any dangling open shifts for this cashier
        CashierShift::where('cashier_id', $cashierId)
            ->whereNull('closed_at')
            ->update([
                'closed_at' => now(),
                'notes' => 'Otomatis ditutup sistem saat membuka shift baru.',
            ]);

        return CashierShift::create([
            'cashier_id' => $cashierId,
            'shift_name' => $shiftName,
            'opened_at' => now(),
            'opening_cash' => $openingCash,
            'total_cash_sales' => 0,
            'total_qris_sales' => 0,
            'notes' => $notes,
        ]);
    }

    /**
     * Close the specified cashier shift session and record actual cash.
     */
    public function closeShift(int $shiftId, float $closingCashActual, ?string $notes = null): CashierShift
    {
        return DB::transaction(function () use ($shiftId, $closingCashActual, $notes) {
            $shift = CashierShift::lockForUpdate()->findOrFail($shiftId);

            $shift->update([
                'closed_at' => now(),
                'closing_cash_actual' => $closingCashActual,
                'notes' => $notes,
            ]);

            return $shift;
        });
    }

    /**
     * Fetch products for the POS catalog with category and stock status.
     *
     * @return Collection<int, Product>
     */
    public function getPosProducts(): Collection
    {
        return Product::with('category')
            ->orderBy('category_id')
            ->orderBy('product_name')
            ->get();
    }

    /**
     * Fetch dining tables with active orders status.
     *
     * @return Collection<int, DiningTable>
     */
    public function getDiningTables(): Collection
    {
        return DiningTable::orderBy('table_number')->get();
    }

    /**
     * Generate sequential queue token number for today (e.g. 001, 002).
     */
    public function generateTokenNumber(): string
    {
        $todayOrders = Order::whereDate('created_at', Carbon::today())->pluck('token_number');
        $maxToken = $todayOrders->map(fn ($t) => (int) $t)->max() ?? 0;
        $nextNumber = max($todayOrders->count() + 1, $maxToken + 1);

        return str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Process, validate, and store a POS / QR Table transaction atomically.
     *
     * @param  array<string, mixed>  $data
     */
    public function createPosOrder(array $data, ?int $cashierId = null, ?int $shiftId = null): Order
    {
        return DB::transaction(function () use ($data, $cashierId, $shiftId) {
            $items = $data['items'] ?? [];
            if (empty($items)) {
                throw ValidationException::withMessages(['cart' => 'Keranjang pesanan masih kosong.']);
            }

            $totalAmount = 0;
            $totalCost = 0;
            $requiresKitchenAny = false;

            // Pre-validate products & calculate totals
            $preparedItems = [];
            foreach ($items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);
                $qty = (int) $item['quantity'];

                if ($qty <= 0) {
                    continue;
                }

                if (! $product->is_available || $product->stock_qty <= 0) {
                    throw ValidationException::withMessages([
                        'stock' => "Menu '{$product->product_name}' saat ini tidak aktif untuk dijual atau sedang habis.",
                    ]);
                }

                if ($product->stock_qty < $qty) {
                    throw ValidationException::withMessages([
                        'stock' => "Stok untuk menu '{$product->product_name}' tidak mencukupi (sisa {$product->stock_qty}, diminta {$qty}).",
                    ]);
                }

                $unitPrice = (float) $product->selling_price;
                $unitCost = (float) $product->cost_price;
                $subtotal = $unitPrice * $qty;

                $totalAmount += $subtotal;
                $totalCost += ($unitCost * $qty);

                if ($product->requires_kitchen) {
                    $requiresKitchenAny = true;
                }

                $preparedItems[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'unit_cost' => $unitCost,
                    'subtotal' => $subtotal,
                    'notes' => $item['notes'] ?? null,
                ];
            }

            // Check if this is a QR Table order that requires Cashier Verification
            $isQrOrder = ($data['order_source'] ?? '') === 'qr_table';
            // Verification is ONLY required for customer-initiated QR orders (where cashierId is empty/null)
            $requiresVerification = $isQrOrder && empty($cashierId) && (bool) SystemSetting::get('qr_require_cashier_verification', true);

            if ($requiresVerification) {
                // Pending cashier verification: payment is unpaid, no change calculated yet
                $paymentStatus = 'unpaid';
                $orderStatus = 'pending';
                $amountReceived = 0;
                $changeAmount = 0;
            } else {
                // Direct Cashier / Immediate processing
                $paymentStatus = 'paid';
                $amountReceived = (float) ($data['amount_received'] ?? $totalAmount);
                if ($data['payment_method'] === 'tunai' && $amountReceived < $totalAmount) {
                    throw ValidationException::withMessages([
                        'amount_received' => 'Uang yang diterima (Rp '.number_format($amountReceived, 0, ',', '.').') kurang dari total belanja (Rp '.number_format($totalAmount, 0, ',', '.').').',
                    ]);
                }

                if ($data['payment_method'] === 'qris') {
                    $amountReceived = $totalAmount;
                }

                $changeAmount = max(0, $amountReceived - $totalAmount);

                // If any item requires kitchen cooking -> 'processing' (sent to kitchen KDS)
                // If all items are instant (drinks/snacks) -> 'served' (immediately ready and handed over)
                $orderStatus = $requiresKitchenAny ? 'processing' : 'served';
            }

            $tokenNumber = $this->generateTokenNumber();
            $invoiceNumber = 'INV-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -5));

            // Create Order
            $order = Order::create([
                'invoice_number' => $invoiceNumber,
                'token_number' => $tokenNumber,
                'shift_id' => $shiftId,
                'table_id' => $data['table_id'] ?? null,
                'cashier_id' => $cashierId,
                'customer_name' => $data['customer_name'] ?? 'Pelanggan Meja',
                'order_source' => $data['order_source'] ?? 'qr_table',
                'order_status' => $orderStatus,
                'payment_method' => $data['payment_method'],
                'payment_status' => $paymentStatus,
                'total_cost' => $totalCost,
                'total_amount' => $totalAmount,
                'amount_received' => $amountReceived,
                'change_amount' => $changeAmount,
            ]);

            $effectiveUserId = $cashierId ?: User::value('id');

            // Save order items & kitchen tickets
            foreach ($preparedItems as $prep) {
                /** @var Product $product */
                $product = $prep['product'];
                $qty = $prep['quantity'];

                $itemStatus = $requiresVerification
                    ? 'pending_confirmation'
                    : ($product->requires_kitchen ? 'queued_kds' : 'instant');

                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_cost' => $prep['unit_cost'],
                    'unit_price' => $prep['unit_price'],
                    'subtotal' => $prep['subtotal'],
                    'notes' => $prep['notes'],
                    'item_status' => $itemStatus,
                ]);

                // Deduct stock atomically to reserve the items
                $newStock = max(0, $product->stock_qty - $qty);
                $product->update([
                    'stock_qty' => $newStock,
                    'is_available' => $newStock > 0,
                ]);

                // Record stock movement
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $effectiveUserId,
                    'movement_type' => 'out',
                    'quantity_change' => -$qty,
                    'notes' => "Penjualan #{$invoiceNumber}",
                ]);

                // Only dispatch Kitchen Ticket immediately if NOT pending verification
                if (! $requiresVerification && $product->requires_kitchen) {
                    KitchenTicket::create([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'token_number' => $tokenNumber,
                        'ticket_status' => 'waiting',
                        'is_audio_notified' => false,
                        'sent_to_kds_at' => now(),
                    ]);
                }
            }

            // Update shift sales aggregation only if immediately paid
            if (! $requiresVerification && $shiftId) {
                $shift = CashierShift::find($shiftId);
                if ($shift) {
                    if ($data['payment_method'] === 'tunai') {
                        $shift->increment('total_cash_sales', $totalAmount);
                    } else {
                        $shift->increment('total_qris_sales', $totalAmount);
                    }
                }
            }

            // Mark dining table occupied if table_id is associated
            if (! empty($data['table_id'])) {
                DiningTable::where('id', $data['table_id'])->update(['status' => 'occupied']);
            }

            return $order->load(['items.product', 'table', 'cashier']);
        });
    }

    /**
     * Orders ready for cashier fulfillment (handshake with kitchen).
     * Strictly orders where kitchen has confirmed cooking and delivered to cashier ('ready').
     *
     * @return Collection<int, Order>
     */
    public function getFulfillmentOrders(): Collection
    {
        return Order::with(['items.product', 'table', 'kitchenTickets.orderItem.product'])
            ->where('order_status', 'ready')
            ->whereHas('kitchenTickets')
            ->latest()
            ->limit(25)
            ->get();
    }

    /**
     * Recent transactions for cashier workstation (today / current shift).
     *
     * @return Collection<int, Order>
     */
    public function getRecentTransactions(?int $shiftId = null): Collection
    {
        $query = Order::with(['items.product', 'table', 'cashier', 'kitchenTickets.orderItem.product'])
            ->whereDate('created_at', Carbon::today());

        if ($shiftId) {
            $query->where('shift_id', $shiftId);
        }

        return $query->latest()->limit(50)->get();
    }

    /**
     * Orders submitted by customers from QR tables waiting for cashier confirmation & payment.
     *
     * @return Collection<int, Order>
     */
    public function getPendingQrOrders(): Collection
    {
        return Order::with(['items.product', 'table'])
            ->where('order_source', 'qr_table')
            ->where('order_status', 'pending')
            ->where('payment_status', 'unpaid')
            ->latest()
            ->get();
    }

    /**
     * Cashier confirms and accepts payment for a pending QR table order.
     * Transitions order to paid, dispatches kitchen tickets to KDS, and records shift revenue.
     */
    public function confirmQrOrderPayment(int $orderId, int $cashierId, ?int $shiftId, string $paymentMethod, float $amountReceived): Order
    {
        return DB::transaction(function () use ($orderId, $cashierId, $shiftId, $paymentMethod, $amountReceived) {
            $order = Order::lockForUpdate()->findOrFail($orderId);

            if ($order->payment_status === 'paid') {
                throw ValidationException::withMessages(['order' => 'Pesanan ini sudah dibayar sebelumnya.']);
            }

            $totalAmount = (float) $order->total_amount;

            if ($paymentMethod === 'tunai' && $amountReceived < $totalAmount) {
                throw ValidationException::withMessages([
                    'amount_received' => 'Uang yang diterima (Rp '.number_format($amountReceived, 0, ',', '.').') kurang dari total tagihan (Rp '.number_format($totalAmount, 0, ',', '.').').',
                ]);
            }

            if ($paymentMethod === 'qris') {
                $amountReceived = $totalAmount;
            }

            $changeAmount = max(0, $amountReceived - $totalAmount);

            // Check if any items require kitchen processing
            $requiresKitchenAny = $order->items()->whereHas('product', fn ($q) => $q->where('requires_kitchen', true))->exists();
            $targetOrderStatus = $requiresKitchenAny ? 'processing' : 'served';

            $order->update([
                'cashier_id' => $cashierId,
                'shift_id' => $shiftId,
                'payment_method' => $paymentMethod,
                'payment_status' => 'paid',
                'amount_received' => $amountReceived,
                'change_amount' => $changeAmount,
                'order_status' => $targetOrderStatus,
            ]);

            // Dispatch kitchen tickets for made-to-order items and update item statuses
            foreach ($order->items as $orderItem) {
                $product = $orderItem->product;
                if ($product && $product->requires_kitchen) {
                    KitchenTicket::firstOrCreate(
                        ['order_item_id' => $orderItem->id],
                        [
                            'order_id' => $order->id,
                            'token_number' => $order->token_number,
                            'ticket_status' => 'waiting',
                            'is_audio_notified' => false,
                            'sent_to_kds_at' => now(),
                        ]
                    );
                    $orderItem->update(['item_status' => 'queued_kds']);
                } else {
                    $orderItem->update(['item_status' => 'instant']);
                }
            }

            // Update shift sales aggregation
            if ($shiftId) {
                $shift = CashierShift::find($shiftId);
                if ($shift) {
                    if ($paymentMethod === 'tunai') {
                        $shift->increment('total_cash_sales', $totalAmount);
                    } else {
                        $shift->increment('total_qris_sales', $totalAmount);
                    }
                }
            }

            return $order->load(['items.product', 'table', 'cashier']);
        });
    }

    /**
     * Cashier rejects or cancels a pending QR table order.
     * Restores reserved stock, cancels tickets, and releases the table.
     */
    public function cancelQrOrder(int $orderId, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($orderId, $reason) {
            $order = Order::lockForUpdate()->findOrFail($orderId);

            if ($order->order_status === 'served') {
                throw ValidationException::withMessages(['order' => 'Pesanan yang sudah selesai disajikan tidak dapat dibatalkan.']);
            }

            // Return stock to inventory
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock_qty', $item->quantity);
                    $item->product->update(['is_available' => true]);

                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'user_id' => $order->cashier_id ?: User::value('id'),
                        'movement_type' => 'in',
                        'quantity_change' => $item->quantity,
                        'notes' => "Pengembalian stok dari pembatalan pesanan Meja #{$order->invoice_number}".($reason ? " ($reason)" : ''),
                    ]);
                }
            }

            // Cancel any tickets
            $order->kitchenTickets()->delete();

            $order->update([
                'order_status' => 'cancelled',
                'payment_status' => 'unpaid',
            ]);

            // Release table if no other active orders exist on it
            if ($order->table_id) {
                $hasOtherActive = Order::where('table_id', $order->table_id)
                    ->where('id', '!=', $order->id)
                    ->whereNotIn('order_status', ['served', 'cancelled'])
                    ->exists();

                if (! $hasOtherActive) {
                    $order->table?->update(['status' => 'available']);
                }
            }

            return $order;
        });
    }

    /**
     * Complete and mark order as served to customer.
     */
    public function markOrderServed(int $orderId): Order
    {
        return DB::transaction(function () use ($orderId) {
            $order = Order::findOrFail($orderId);
            $order->update(['order_status' => 'served']);
            $order->items()->update(['item_status' => 'served']);
            $order->kitchenTickets()->update([
                'ticket_status' => 'completed',
                'completed_at' => now(),
            ]);

            // Auto-rotate table QR token to prevent "customer iseng" from ordering using old photos
            if ($order->table_id && SystemSetting::get('qr_auto_rotate_token', true)) {
                $order->table?->update([
                    'qr_code_token' => Str::random(32),
                    'status' => 'available',
                ]);
            }

            return $order;
        });
    }
}
