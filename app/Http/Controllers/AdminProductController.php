<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\AdminReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminProductController extends Controller
{
    public function __construct(
        protected AdminReportService $reportService,
    ) {}

    /**
     * Display the dedicated Products & Inventory Management page.
     */
    public function index(Request $request): InertiaResponse
    {
        $filters = [
            'search' => $request->input('search', ''),
            'category_id' => $request->input('category_id', 'all'),
            'requires_kitchen' => $request->input('requires_kitchen', 'all'),
            'stock_status' => $request->input('stock_status', 'all'),
            'per_page' => $request->input('per_page', 12),
        ];

        $products = $this->reportService->getFilteredProducts($filters);
        $categories = Category::withCount('products')->orderBy('category_name')->get();

        $metrics = [
            'total_products' => Product::count(),
            'available_products' => Product::where('stock_qty', '>', 5)->where('is_available', true)->count(),
            'low_stock_products' => Product::where('stock_qty', '>', 0)->where('stock_qty', '<=', 5)->count(),
            'out_of_stock_products' => Product::where('stock_qty', '<=', 0)->orWhere('is_available', false)->count(),
        ];

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'metrics' => $metrics,
            'filters' => $filters,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): RedirectResponse
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

        DB::transaction(function () use ($validated, $request): void {
            if ((int) $validated['stock_qty'] <= 0) {
                $validated['is_available'] = false;
            }

            $product = Product::create($validated);

            if ((int) $validated['stock_qty'] > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()?->id ?: User::where('role', 'admin')->value('id'),
                    'movement_type' => 'in',
                    'quantity_change' => (int) $validated['stock_qty'],
                    'notes' => 'Stok awal produk baru',
                ]);
            }
        });

        return redirect()->back()->with('success', "Produk '{$validated['product_name']}' berhasil ditambahkan ke katalog.");
    }

    /**
     * Update product details.
     */
    public function update(Request $request, Product $product): RedirectResponse
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
     * Delete a product (Soft Delete).
     */
    public function destroy(Product $product): RedirectResponse
    {
        $name = $product->product_name;
        $product->delete();

        return redirect()->back()->with('success', "Produk '{$name}' berhasil dihapus.");
    }

    /**
     * Record a manual stock adjustment.
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
     * Check if a barcode is already registered.
     */
    public function checkBarcode(Request $request): JsonResponse
    {
        $barcode = trim((string) $request->input('barcode', ''));

        if (! $barcode) {
            return response()->json(['found' => false]);
        }

        $product = Product::with('category')->where('barcode', $barcode)->first();

        if ($product) {
            return response()->json([
                'found' => true,
                'product' => [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'barcode' => $product->barcode,
                    'selling_price' => $product->selling_price,
                    'stock_qty' => $product->stock_qty,
                    'category' => $product->category?->category_name,
                ],
            ]);
        }

        return response()->json(['found' => false, 'barcode' => $barcode]);
    }
}
