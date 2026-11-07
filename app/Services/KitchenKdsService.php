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
            ->whereHas('order', function ($q): void {
                $q->whereNotIn('order_status', ['served', 'cancelled']);
            })
            ->orderByRaw("CASE ticket_status WHEN 'waiting' THEN 1 WHEN 'cooking' THEN 2 WHEN 'delivered_to_cashier' THEN 3 ELSE 4 END")
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

            $updateData = [
                'ticket_status' => $status,
                'is_audio_notified' => true,
            ];

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

            // Synchronize parent Order status (ready if all tickets delivered, processing if any pending)
            $order = Order::find($ticket->order_id);
            if ($order && $order->order_status !== 'served') {
                $hasPendingKitchenTickets = KitchenTicket::where('order_id', $order->id)
                    ->whereIn('ticket_status', ['waiting', 'cooking'])
                    ->exists();

                $targetStatus = $hasPendingKitchenTickets ? 'processing' : 'ready';
                if ($order->order_status !== $targetStatus) {
                    $order->update(['order_status' => $targetStatus]);
                }
            }

            return $ticket->load(['order.table', 'orderItem.product', 'chef']);
        });
    }
}
