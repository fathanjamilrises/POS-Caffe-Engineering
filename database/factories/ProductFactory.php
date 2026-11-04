<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $cost = fake()->numberBetween(5000, 50000);
        $selling = $cost + fake()->numberBetween(3000, 20000);

        return [
            'category_id' => Category::factory(),
            'barcode' => fake()->unique()->ean13(),
            'product_name' => fake()->words(3, true),
            'cost_price' => $cost,
            'selling_price' => $selling,
            'stock_qty' => fake()->numberBetween(10, 100),
            'requires_kitchen' => fake()->boolean(60),
            'is_available' => true,
        ];
    }

    /**
     * Indicate that product requires kitchen preparation.
     */
    public function requiresKitchen(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_kitchen' => true,
        ]);
    }

    /**
     * Indicate that product is instant (no kitchen required).
     */
    public function instant(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_kitchen' => false,
        ]);
    }
}
