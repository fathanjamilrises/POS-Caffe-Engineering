<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 5);
        $cost = fake()->numberBetween(5000, 25000);
        $price = $cost + 5000;

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'quantity' => $qty,
            'unit_cost' => $cost,
            'unit_price' => $price,
            'subtotal' => $qty * $price,
            'notes' => fake()->optional()->sentence(),
            'item_status' => fake()->randomElement(['instant', 'queued_kds', 'cooking', 'delivered_to_cashier', 'served']),
        ];
    }
}
