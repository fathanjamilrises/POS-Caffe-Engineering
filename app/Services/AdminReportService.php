<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\OperationalExpense;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AdminReportService
{
    /**
     * Compute executive summary metrics for P&L and stock status with flexible date filtering.
     *
     * @return array<string, mixed>
     */
    public function getSummaryMetrics(?string $date = null, ?string $preset = 'today'): array
    {
        $now = Carbon::today();
        $startDate = null;
        $endDate = null;
        $label = 'Hari Ini';

        if ($date) {
            $startDate = Carbon::parse($date)->startOfDay();
            $endDate = Carbon::parse($date)->endOfDay();
            $label = $startDate->format('d M Y');
        } elseif ($preset === 'yesterday') {
            $startDate = Carbon::yesterday()->startOfDay();
            $endDate = Carbon::yesterday()->endOfDay();
            $label = 'Kemarin ('.Carbon::yesterday()->format('d M').')';
        } elseif ($preset === 'this_week') {
            $startDate = Carbon::now()->startOfWeek();
            $endDate = Carbon::now()->endOfWeek();
            $label = 'Minggu Ini';
        } elseif ($preset === 'this_month') {
            $startDate = Carbon::now()->startOfMonth();
            $endDate = Carbon::now()->endOfMonth();
            $label = 'Bulan '.Carbon::now()->translatedFormat('F Y');
        } else { // default today
            $startDate = $now->copy()->startOfDay();
            $endDate = $now->copy()->endOfDay();
            $label = 'Hari Ini ('.$now->format('d M Y').')';
        }

        $paidOrdersQuery = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid');

        $grossRevenue = (float) (clone $paidOrdersQuery)->sum('total_amount');
        $cashRevenue = (float) (clone $paidOrdersQuery)->where('payment_method', 'tunai')->sum('total_amount');
        $qrisRevenue = (float) (clone $paidOrdersQuery)->where('payment_method', 'qris')->sum('total_amount');
        $totalCost = (float) (clone $paidOrdersQuery)->sum('total_cost');

        $operationalExpenses = (float) OperationalExpense::query()
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('amount');

        $netProfit = $grossRevenue - $totalCost - $operationalExpenses;

        $totalOrdersCount = (int) (clone $paidOrdersQuery)->count();

        $criticalStockCount = Product::query()
            ->where(function ($q): void {
                $q->where('stock_qty', '<=', 5)
                    ->orWhere('is_available', false);
            })
            ->count();

        $outOfStockCount = Product::query()
            ->where('stock_qty', '<=', 0)
            ->count();

        return [
            'target_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'label' => $label,
            'preset' => $preset,
            'gross_revenue' => $grossRevenue,
            'cash_revenue' => $cashRevenue,
            'qris_revenue' => $qrisRevenue,
            'total_cost' => $totalCost,
            'operational_expenses' => $operationalExpenses,
            'net_profit' => $netProfit,
            'total_orders_count' => $totalOrdersCount,
            'critical_stock_count' => $criticalStockCount,
            'out_of_stock_count' => $outOfStockCount,
        ];
    }

    /**
     * Get filtered products with category and movement counts.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getFilteredProducts(array $filters): LengthAwarePaginator
    {
        $query = Product::with('category')->latest();

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search): void {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['requires_kitchen']) && $filters['requires_kitchen'] !== '' && $filters['requires_kitchen'] !== 'all') {
            $query->where('requires_kitchen', filter_var($filters['requires_kitchen'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['stock_status'])) {
            if ($filters['stock_status'] === 'out_of_stock') {
                $query->where('stock_qty', '<=', 0);
            } elseif ($filters['stock_status'] === 'low_stock') {
                $query->where('stock_qty', '>', 0)->where('stock_qty', '<=', 5);
            } elseif ($filters['stock_status'] === 'available') {
                $query->where('stock_qty', '>', 5)->where('is_available', true);
            }
        }

        $perPage = ! empty($filters['per_page']) ? (int) $filters['per_page'] : 10;

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Retrieve cashier shifts with discrepancy calculations.
     *
     * @return Collection<int, CashierShift>
     */
    public function getRecentShifts(int $limit = 15): Collection
    {
        $shifts = CashierShift::with('cashier')
            ->latest('opened_at')
            ->limit($limit)
            ->get();

        return $shifts->map(function (CashierShift $shift) {
            $expectedCash = (float) $shift->opening_cash + (float) $shift->total_cash_sales;
            $closingActual = $shift->closing_cash_actual !== null ? (float) $shift->closing_cash_actual : null;
            $discrepancy = $closingActual !== null ? ($closingActual - $expectedCash) : null;

            $shift->setAttribute('expected_cash', $expectedCash);
            $shift->setAttribute('discrepancy', $discrepancy);

            return $shift;
        });
    }

    /**
     * Retrieve recent transactions with table and cashier details.
     *
     * @return Collection<int, Order>
     */
    public function getRecentOrders(int $limit = 20): Collection
    {
        return Order::with(['table', 'cashier', 'items.product'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Retrieve dining tables with active order count.
     *
     * @return Collection<int, DiningTable>
     */
    public function getDiningTables(): Collection
    {
        return DiningTable::withCount(['orders' => function ($q): void {
            $q->whereIn('order_status', ['pending', 'processing', 'ready']);
        }])->orderBy('table_number')->get();
    }

    /**
     * Record a stock movement atomically and synchronize product stock.
     *
     * @param  array{product_id: int, movement_type: string, quantity_change: int, notes?: ?string}  $data
     */
    public function recordStockAdjustment(array $data, ?int $userId = null): StockMovement
    {
        return DB::transaction(function () use ($data, $userId) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);

            $qtyChange = (int) $data['quantity_change'];
            $type = $data['movement_type'];

            if ($type === 'in') {
                $qtyChange = abs($qtyChange);
                $newStock = $product->stock_qty + $qtyChange;
            } elseif ($type === 'out') {
                $qtyChange = -abs($qtyChange);
                $newStock = max(0, $product->stock_qty + $qtyChange);
            } else { // adjustment
                $newStock = max(0, $product->stock_qty + $qtyChange);
            }

            $product->update([
                'stock_qty' => $newStock,
                'is_available' => $newStock > 0,
            ]);

            $effectiveUserId = $userId ?: User::where('role', 'admin')->value('id') ?: User::value('id');

            return StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $effectiveUserId,
                'movement_type' => $type,
                'quantity_change' => $qtyChange,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Generate CSV export for orders.
     */
    public function generateOrdersCsv(): string
    {
        $orders = Order::with(['table', 'cashier'])->latest()->limit(1000)->get();

        $output = fopen('php://temp', 'r+');
        fwrite($output, "\xEF\xBB\xBF");

        fputcsv($output, [
            'Invoice Number',
            'Token Number',
            'Sumber Pesanan',
            'Meja',
            'Kasir',
            'Metode Pembayaran',
            'Status Pembayaran',
            'Status Pesanan',
            'Total HPP (Modal)',
            'Total Penjualan',
            'Jumlah Diterima',
            'Kembalian',
            'Waktu Transaksi',
        ]);

        foreach ($orders as $order) {
            fputcsv($output, [
                $order->invoice_number,
                $order->token_number,
                $order->order_source === 'qr_table' ? 'QR Meja' : 'Kasir Langsung',
                $order->table?->table_number ?? '-',
                $order->cashier?->full_name ?? '-',
                strtoupper((string) $order->payment_method),
                strtoupper((string) $order->payment_status),
                strtoupper((string) $order->order_status),
                $order->total_cost,
                $order->total_amount,
                $order->amount_received,
                $order->change_amount,
                $order->created_at?->format('Y-m-d H:i:s'),
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv ?: '';
    }

    /**
     * Generate CSV export for shifts.
     */
    public function generateShiftsCsv(): string
    {
        $shifts = $this->getRecentShifts(200);

        $output = fopen('php://temp', 'r+');
        fwrite($output, "\xEF\xBB\xBF");

        fputcsv($output, [
            'Nama Shift',
            'Kasir',
            'Waktu Buka',
            'Waktu Tutup',
            'Modal Awal (Opening Cash)',
            'Total Tunai',
            'Total QRIS',
            'Ekspektasi Kas Fisik',
            'Kas Fisik Aktual',
            'Selisih (Discrepancy)',
            'Catatan',
        ]);

        foreach ($shifts as $shift) {
            fputcsv($output, [
                $shift->shift_name,
                $shift->cashier?->full_name ?? '-',
                $shift->opened_at?->format('Y-m-d H:i:s'),
                $shift->closed_at?->format('Y-m-d H:i:s') ?? 'MASIH BUKA',
                $shift->opening_cash,
                $shift->total_cash_sales,
                $shift->total_qris_sales,
                $shift->expected_cash,
                $shift->closing_cash_actual ?? '-',
                $shift->discrepancy ?? '-',
                $shift->notes ?? '-',
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv ?: '';
    }
}
