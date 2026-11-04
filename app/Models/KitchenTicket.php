<?php

namespace App\Models;

use Database\Factories\KitchenTicketFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'order_id',
    'order_item_id',
    'token_number',
    'chef_id',
    'ticket_status',
    'is_audio_notified',
    'sent_to_kds_at',
    'completed_at',
])]
class KitchenTicket extends Model
{
    /** @use HasFactory<KitchenTicketFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_audio_notified' => 'boolean',
            'sent_to_kds_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Order this kitchen ticket belongs to.
     *
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Order item for this ticket.
     *
     * @return BelongsTo<OrderItem, $this>
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    /**
     * Chef/kitchen staff assigned to this ticket.
     *
     * @return BelongsTo<User, $this>
     */
    public function chef(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chef_id');
    }
}
