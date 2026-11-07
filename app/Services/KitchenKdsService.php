<?php

namespace App\Services;

use App\Models\KitchenTicket;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class KitchenKdsService
{
    /**
     * Retrieve all active kitchen tickets (waiting, cooking, delivered_to_cashier)
     * and today's completed tickets for kitchen staff history.
     *
     * @return Collection<int, KitchenTicket>
     */
    public function getActiveTickets(): Collection
    {
        $today = Carbon::today();

        return KitchenTicket::with([
            'order.table',
            'order.cashier',
            'order.items.product',
            'orderItem.product.category',
            'chef',
        ])
            ->where(function ($query) use ($today) {
                $query->whereIn('ticket_status', ['waiting', 'cooking', 'delivered_to_cashier'])
                    ->orWhere(function ($q) use ($today) {
                        $q->where('ticket_status', 'completed')
                            ->whereDate('updated_at', $today);
                    });
            })
            ->orderByRaw("CASE 
                WHEN ticket_status = 'waiting' THEN 1 
                WHEN ticket_status = 'cooking' THEN 2 
                WHEN ticket_status = 'delivered_to_cashier' THEN 3 
                ELSE 4 
            END")
            ->orderBy('sent_to_kds_at', 'asc')
            ->get();
    }

    /**
     * Check how many new unacknowledged tickets exist for audio alert triggering.
     */
    public function getUnnotifiedCount(): int
    {
        return KitchenTicket::query()
            ->where('ticket_status', 'waiting')
            ->where('is_audio_notified', false)
            ->count();
    }

    /**
     * Mark tickets as audio notified to silence the bell.
     *
     * @param  array<int>  $ticketIds
     */
    public function markAudioNotified(array $ticketIds = []): void
    {
        $query = KitchenTicket::where('is_audio_notified', false);
        if (! empty($ticketIds)) {
            $query->whereIn('id', $ticketIds);
        }
        $query->update(['is_audio_notified' => true]);
    }

    /**
     * Progress kitchen ticket status and synchronize parent order.
     */
    public function updateTicketStatus(int $ticketId, string $status, ?int $chefId = null): KitchenTicket
    {
        return DB::transaction(function () use ($ticketId, $status, $chefId) {
            $ticket = KitchenTicket::lockForUpdate()->findOrFail($ticketId);

            $updateData = ['ticket_status' => $status];
            if ($status === 'cooking' && $chefId) {
                $updateData['chef_id'] = $chefId;
            }

            if ($status === 'delivered_to_cashier' || $status === 'completed') {
                $updateData['completed_at'] = now();
            }

            $ticket->update($updateData);

            // Synchronize OrderItem status
            if ($ticket->orderItem) {
                $itemStatus = match ($status) {
                    'cooking' => 'cooking',
                    'delivered_to_cashier' => 'delivered_to_cashier',
                    'completed' => 'served',
                    default => 'queued_kds',
                };
                $ticket->orderItem->update(['item_status' => $itemStatus]);
            }

            // If all kitchen tickets for this order are delivered_to_cashier or completed, update order to 'ready'
            $order = Order::find($ticket->order_id);
            if ($order) {
                $hasPendingKitchenTickets = KitchenTicket::where('order_id', $order->id)
                    ->whereIn('ticket_status', ['waiting', 'cooking'])
                    ->exists();

                if (! $hasPendingKitchenTickets && $order->order_status !== 'served') {
                    $order->update(['order_status' => 'ready']);
                }
            }

            return $ticket->load(['order.table', 'order.items.product', 'orderItem.product', 'chef']);
        });
    }
}
