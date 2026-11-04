<?php

namespace Database\Factories;

use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<KitchenTicket>
 */
class KitchenTicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'order_item_id' => OrderItem::factory(),
            'token_number' => 'A-'.fake()->numberBetween(1, 99),
            'chef_id' => User::factory()->dapur(),
            'ticket_status' => 'waiting',
            'is_audio_notified' => false,
            'sent_to_kds_at' => now(),
            'completed_at' => null,
        ];
    }
}
