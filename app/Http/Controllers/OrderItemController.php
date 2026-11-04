<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderItemController extends Controller
{
    /**
     * Display a listing of order items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrderItem::with(['order', 'product', 'kitchenTicket']);

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->input('order_id'));
        }

        if ($request->filled('item_status')) {
            $query->where('item_status', $request->input('item_status'));
        }

        $items = $query->latest()->paginate(20);

        return response()->json($items);
    }

    /**
     * Display the specified order item.
     */
    public function show(OrderItem $orderItem): JsonResponse
    {
        $orderItem->load(['order', 'product', 'kitchenTicket']);

        return response()->json($orderItem);
    }

    /**
     * Update item status.
     */
    public function updateStatus(Request $request, OrderItem $orderItem): JsonResponse
    {
        $validated = $request->validate([
            'item_status' => [
                'required',
                'string',
                Rule::in(['instant', 'queued_kds', 'cooking', 'delivered_to_cashier', 'served']),
            ],
        ]);

        $orderItem->update($validated);

        return response()->json([
            'message' => 'Status item pesanan berhasil diperbarui',
            'data' => $orderItem,
        ]);
    }
}
