<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Product;
use App\Services\AdminReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected AdminReportService $reportService,
    ) {}

    /**
     * Display the Admin Dashboard with full inventory, shifts, tables, and reports.
     */
    public function index(Request $request): InertiaResponse
    {
        $filters = [
            'search' => $request->input('search', ''),
            'category_id' => $request->input('category_id', 'all'),
            'requires_kitchen' => $request->input('requires_kitchen', 'all'),
            'stock_status' => $request->input('stock_status', 'all'),
            'per_page' => $request->input('per_page', 10),
            'date' => $request->input('date', ''),
            'preset' => $request->input('preset', 'today'),
        ];

        $summaryMetrics = $this->reportService->getSummaryMetrics(
            $filters['date'] ?: null,
            $filters['preset'] ?: 'today'
        );

        $products = $this->reportService->getFilteredProducts($filters);
        $cashierShifts = $this->reportService->getRecentShifts(20);
        $recentOrders = $this->reportService->getRecentOrders(25);
        $diningTables = $this->reportService->getDiningTables();
        $categories = Category::withCount('products')->orderBy('category_name')->get();

        return Inertia::render('Admin/Dashboard', [
            'summary_metrics' => $summaryMetrics,
            'products' => $products,
            'cashier_shifts' => $cashierShifts,
            'recent_orders' => $recentOrders,
            'categories' => $categories,
            'dining_tables' => $diningTables,
            'filters' => $filters,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    /**
     * Record a manual stock adjustment from the Admin table.
     */
    public function adjustStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'movement_type' => ['required', 'string', Rule::in(['in', 'out', 'adjustment'])],
            'quantity_change' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $this->reportService->recordStockAdjustment($validated, $request->user()?->id);

        return redirect()->back()->with('success', 'Penyesuaian stok berhasil disimpan.');
    }

    /**
     * Update product details from the Admin table.
     */
    public function updateProduct(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')->ignore($product->id)],
            'image_url' => ['nullable', 'string', 'max:500'],
            'product_name' => ['required', 'string', 'max:150'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock_qty' => ['required', 'integer', 'min:0'],
            'requires_kitchen' => ['required', 'boolean'],
            'is_available' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($product, $validated): void {
            if ((int) $validated['stock_qty'] <= 0) {
                $validated['is_available'] = false;
            }

            $product->update($validated);
        });

        return redirect()->back()->with('success', "Produk '{$product->product_name}' berhasil diperbarui.");
    }

    /**
     * Store a newly created product.
     */
    public function storeProduct(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:products,barcode'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'product_name' => ['required', 'string', 'max:150'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock_qty' => ['required', 'integer', 'min:0'],
            'requires_kitchen' => ['required', 'boolean'],
            'is_available' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($validated): void {
            if ((int) $validated['stock_qty'] <= 0) {
                $validated['is_available'] = false;
            }

            Product::create($validated);
        });

        return redirect()->back()->with('success', 'Produk baru berhasil ditambahkan.');
    }

    /**
     * Delete a product (Soft Delete).
     */
    public function destroyProduct(Product $product): RedirectResponse
    {
        $name = $product->product_name;
        $product->delete();

        return redirect()->back()->with('success', "Produk '{$name}' berhasil dihapus (soft delete).");
    }

    /**
     * Store a newly created category.
     */
    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_name' => ['required', 'string', 'max:100', 'unique:categories,category_name'],
        ]);

        Category::create($validated);

        return redirect()->back()->with('success', "Kategori '{$validated['category_name']}' berhasil ditambahkan.");
    }

    /**
     * Update dining table status.
     */
    public function updateTableStatus(Request $request, DiningTable $diningTable): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:available,occupied,reserved'],
        ]);

        $diningTable->update($validated);

        return redirect()->back()->with('success', "Status Meja '{$diningTable->table_number}' diubah ke {$validated['status']}.");
    }

    /**
     * Export reports to CSV/Excel format.
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $type = $request->input('type', 'orders');
        $filename = $type === 'shifts'
            ? 'rekap_shift_kasir_'.date('Ymd_His').'.csv'
            : 'riwayat_transaksi_'.date('Ymd_His').'.csv';

        $csvContent = $type === 'shifts'
            ? $this->reportService->generateShiftsCsv()
            : $this->reportService->generateOrdersCsv();

        return response()->streamDownload(function () use ($csvContent): void {
            echo $csvContent;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Render print-ready HTML view for 1-click Save as PDF.
     */
    public function exportPdf(Request $request): Response
    {
        $date = $request->input('date');
        $preset = $request->input('preset', 'today');

        $summaryMetrics = $this->reportService->getSummaryMetrics($date ?: null, $preset ?: 'today');
        $recentOrders = $this->reportService->getRecentOrders(50);
        $cashierShifts = $this->reportService->getRecentShifts(20);

        return response()->view('reports.executive_pdf', [
            'summary_metrics' => $summaryMetrics,
            'recent_orders' => $recentOrders,
            'cashier_shifts' => $cashierShifts,
            'generated_at' => now()->format('d M Y, H:i:s'),
        ]);
    }
}
