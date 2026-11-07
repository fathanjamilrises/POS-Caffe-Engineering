<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
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

            // Payment validation: amount_received must be >= total_amount
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
            $tokenNumber = $this->generateTokenNumber();
            $invoiceNumber = 'INV-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -5));

            $orderStatus = $requiresKitchenAny ? 'processing' : 'ready';

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
                'payment_status' => 'paid',
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

                $itemStatus = $product->requires_kitchen ? 'queued_kds' : 'instant';

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

                // Deduct stock atomically
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

                // If requires kitchen, dispatch Kitchen Ticket
                if ($product->requires_kitchen) {
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

            // Update shift sales aggregation if shift is open
            if ($shiftId) {
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
     *
     * @return Collection<int, Order>
     */
    public function getFulfillmentOrders(): Collection
    {
        return Order::with(['items.product', 'table'])
            ->whereIn('order_status', ['processing', 'ready'])
            ->latest()
            ->limit(15)
            ->get();
    }

    /**
     * Complete and mark order as served to customer (Fulfillment Handshake).
     */
    public function markOrderServed(int $orderId): Order
    {
        return DB::transaction(function () use ($orderId) {
            $order = Order::findOrFail($orderId);
            $order->update(['order_status' => 'served']);
            $order->items()->update(['item_status' => 'served']);

            // Complete any related kitchen tickets
            KitchenTicket::where('order_id', $orderId)->update([
                'ticket_status' => 'completed',
                'completed_at' => now(),
            ]);

            if ($order->table_id) {
                $hasActiveOrders = Order::where('table_id', $order->table_id)
                    ->whereIn('order_status', ['pending', 'processing', 'ready'])
                    ->where('id', '!=', $order->id)
                    ->exists();

                if (! $hasActiveOrders) {
                    DiningTable::where('id', $order->table_id)->update(['status' => 'available']);
                }
            }

            return $order;
        });
    }
}
