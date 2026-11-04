<?php

namespace Database\Factories;

use App\Models\CashierShift;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashierShift>
 */
class CashierShiftFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cashier_id' => User::factory()->kasir(),
            'shift_name' => fake()->randomElement(['Shift Pagi', 'Shift Siang', 'Shift Malam']),
            'opened_at' => now(),
            'closed_at' => null,
            'opening_cash' => 500000.00,
            'total_cash_sales' => 0.00,
            'total_qris_sales' => 0.00,
            'closing_cash_actual' => null,
            'notes' => fake()->sentence(),
        ];
    }

    /**
     * Indicate that the shift is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'closed_at' => now(),
            'closing_cash_actual' => ($attributes['opening_cash'] ?? 500000) + ($attributes['total_cash_sales'] ?? 0),
        ]);
    }
}
