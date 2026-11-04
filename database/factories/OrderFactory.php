<?php

namespace Database\Factories;

use App\Models\CashierShift;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalCost = fake()->randomFloat(2, 20000, 100000);
        $totalAmount = $totalCost + fake()->randomFloat(2, 10000, 50000);
        $amountReceived = $totalAmount + 10000;
        $changeAmount = $amountReceived - $totalAmount;

        return [
            'invoice_number' => 'INV-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4)),
            'token_number' => 'A-'.fake()->numberBetween(1, 99),
            'shift_id' => CashierShift::factory(),
            'table_id' => DiningTable::factory(),
            'cashier_id' => User::factory()->kasir(),
            'customer_name' => fake()->name(),
            'order_source' => 'cashier_direct',
            'order_status' => 'confirmed',
            'payment_method' => 'tunai',
            'payment_status' => 'paid',
            'total_cost' => $totalCost,
            'total_amount' => $totalAmount,
            'amount_received' => $amountReceived,
            'change_amount' => $changeAmount,
        ];
    }
}
