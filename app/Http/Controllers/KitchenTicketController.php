<?php

namespace App\Http\Controllers;

use App\Models\KitchenTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KitchenTicketController extends Controller
{
    /**
     * Display a listing of kitchen tickets for KDS.
     */
    public function index(Request $request): JsonResponse
    {
        $query = KitchenTicket::with([
            'order.table',
            'orderItem.product',
            'chef',
        ]);

        if ($request->filled('ticket_status')) {
            $query->where('ticket_status', $request->input('ticket_status'));
        } else {
            // Default active tickets for KDS: exclude completed
            $query->whereIn('ticket_status', ['waiting', 'cooking', 'delivered_to_cashier']);
        }

        if ($request->filled('chef_id')) {
            $query->where('chef_id', $request->input('chef_id'));
        }

        $tickets = $query->orderBy('created_at', 'asc')->get();

        return response()->json($tickets);
    }

    /**
     * Display the specified kitchen ticket.
     */
    public function show(KitchenTicket $kitchenTicket): JsonResponse
    {
        $kitchenTicket->load(['order.table', 'orderItem.product', 'chef']);

        return response()->json($kitchenTicket);
    }

    /**
     * Advance ticket status and assign chef.
     */
    public function updateStatus(Request $request, KitchenTicket $kitchenTicket): JsonResponse
    {
        $validated = $request->validate([
            'ticket_status' => [
                'required',
                'string',
                Rule::in(['waiting', 'cooking', 'delivered_to_cashier', 'completed']),
            ],
            'chef_id' => ['nullable', 'exists:users,id'],
        ]);

        $updateData = [
            'ticket_status' => $validated['ticket_status'],
        ];

        if (isset($validated['chef_id'])) {
            $updateData['chef_id'] = $validated['chef_id'];
        }

        if ($validated['ticket_status'] === 'completed') {
            $updateData['completed_at'] = now();
        }

        $kitchenTicket->update($updateData);

        // Sync corresponding OrderItem status
        $statusMap = [
            'waiting' => 'queued_kds',
            'cooking' => 'cooking',
            'delivered_to_cashier' => 'delivered_to_cashier',
            'completed' => 'served',
        ];

        if (isset($statusMap[$validated['ticket_status']])) {
            $kitchenTicket->orderItem()->update([
                'item_status' => $statusMap[$validated['ticket_status']],
            ]);
        }

        return response()->json([
            'message' => 'Status tiket dapur berhasil diperbarui',
            'data' => $kitchenTicket->fresh()->load(['order.table', 'orderItem.product', 'chef']),
        ]);
    }

    /**
     * Acknowledge audio notification on KDS.
     */
    public function markAudioNotified(KitchenTicket $kitchenTicket): JsonResponse
    {
        $kitchenTicket->update(['is_audio_notified' => true]);

        return response()->json([
            'message' => 'Notifikasi audio tiket berhasil diakui',
            'data' => $kitchenTicket,
        ]);
    }
}
