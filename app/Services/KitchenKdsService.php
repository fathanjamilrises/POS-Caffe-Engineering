<?php

namespace App\Services;

use App\Models\KitchenTicket;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class KitchenKdsService
{
    /**
     * Retrieve all active kitchen tickets (FIFO sorted by sent_to_kds_at).
     *
     * @return Collection<int, KitchenTicket>
     */
    public function getActiveTickets(): Collection
    {
        return KitchenTicket::with([
            'order.table',
            'order.cashier',
            'orderItem.product.category',
            'chef',
        ])
            ->whereIn('ticket_status', ['waiting', 'cooking', 'delivered_to_cashier'])
            ->orderByRaw("FIELD(ticket_status, 'waiting', 'cooking', 'delivered_to_cashier')")
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

            return $ticket->load(['order.table', 'orderItem.product', 'chef']);
        });
    }
}
