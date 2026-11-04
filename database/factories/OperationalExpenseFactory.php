<?php

namespace Database\Factories;

use App\Models\OperationalExpense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OperationalExpense>
 */
class OperationalExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->admin(),
            'expense_name' => fake()->randomElement(['Beli Gas LPG 3kg', 'Beli Kantong Plastik / Paperbag', 'Listrik & Air Toko', 'Beli Sabun Cuci']),
            'amount' => fake()->randomFloat(2, 20000, 250000),
            'expense_date' => fake()->date(),
            'notes' => fake()->sentence(),
        ];
    }
}
