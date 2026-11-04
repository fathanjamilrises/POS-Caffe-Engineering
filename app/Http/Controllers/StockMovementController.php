<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockMovementController extends Controller
{
    /**
     * Display a listing of stock movements.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::with(['product', 'user']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->input('movement_type'));
        }

        $movements = $query->latest()->paginate(20);

        return response()->json($movements);
    }

    /**
     * Store a newly created stock movement and adjust product stock.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'user_id' => ['required', 'exists:users,id'],
            'movement_type' => ['required', 'string', Rule::in(['in', 'out', 'adjustment'])],
            'quantity_change' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($validated) {
            $product = Product::lockForUpdate()->findOrFail($validated['product_id']);

            $qtyChange = (int) $validated['quantity_change'];

            // Adjust stock according to movement type
            if ($validated['movement_type'] === 'in') {
                $qtyChange = abs($qtyChange);
                $newStock = $product->stock_qty + $qtyChange;
            } elseif ($validated['movement_type'] === 'out') {
                $qtyChange = -abs($qtyChange);
                $newStock = max(0, $product->stock_qty + $qtyChange);
            } else { // adjustment
                $newStock = max(0, $product->stock_qty + $qtyChange);
            }

            $product->update([
                'stock_qty' => $newStock,
                'is_available' => $newStock > 0,
            ]);

            return StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $validated['user_id'],
                'movement_type' => $validated['movement_type'],
                'quantity_change' => $qtyChange,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Pergerakan stok berhasil dicatat',
            'data' => $movement->load(['product', 'user']),
        ], 201);
    }

    /**
     * Display the specified stock movement.
     */
    public function show(StockMovement $stockMovement): JsonResponse
    {
        $stockMovement->load(['product', 'user']);

        return response()->json($stockMovement);
    }
}
