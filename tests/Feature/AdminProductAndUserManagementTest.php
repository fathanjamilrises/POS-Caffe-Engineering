<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProductAndUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $cashier;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'username' => 'admin_test',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->cashier = User::factory()->create([
            'username' => 'kasir_test',
            'role' => 'kasir',
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'category_name' => 'Makanan Ringan',
            'slug' => 'makanan-ringan',
        ]);
    }

    public function test_admin_can_access_products_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/products');
        $response->assertStatus(200);
    }

    public function test_cashier_forbidden_from_admin_products(): void
    {
        // Web requests are gracefully redirected to the Cashier POS dashboard
        $response = $this->actingAs($this->cashier)->get('/admin/products');
        $response->assertRedirect(route('cashier.pos'));

        // API/JSON requests receive HTTP 403 Forbidden
        $responseJson = $this->actingAs($this->cashier)->getJson('/admin/products');
        $responseJson->assertStatus(403);
    }

    public function test_admin_can_store_product_with_barcode(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/products', [
            'category_id' => $this->category->id,
            'barcode' => '8991234567890',
            'product_name' => 'Keripik Kentang Renyah',
            'cost_price' => 8000,
            'selling_price' => 15000,
            'stock_qty' => 25,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('products', [
            'barcode' => '8991234567890',
            'product_name' => 'Keripik Kentang Renyah',
            'stock_qty' => 25,
        ]);
    }

    public function test_admin_can_check_barcode(): void
    {
        Product::create([
            'category_id' => $this->category->id,
            'barcode' => '999888777',
            'product_name' => 'Air Mineral Botol',
            'cost_price' => 2000,
            'selling_price' => 5000,
            'stock_qty' => 50,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/admin/products/check-barcode', [
            'barcode' => '999888777',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'found' => true,
            'product' => [
                'barcode' => '999888777',
                'product_name' => 'Air Mineral Botol',
            ],
        ]);
    }

    public function test_admin_can_update_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'barcode' => '111222333',
            'product_name' => 'Jus Alpukat',
            'cost_price' => 7000,
            'selling_price' => 12000,
            'stock_qty' => 10,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin)->put("/admin/products/{$product->id}", [
            'category_id' => $this->category->id,
            'barcode' => '111222333',
            'product_name' => 'Jus Alpukat Kocok Spesial',
            'cost_price' => 8000,
            'selling_price' => 15000,
            'stock_qty' => 15,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(302);
        $this->assertEquals('Jus Alpukat Kocok Spesial', $product->fresh()->product_name);
        $this->assertEquals(15000, $product->fresh()->selling_price);
    }

    public function test_admin_can_adjust_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'barcode' => '555444333',
            'product_name' => 'Kopi Tubruk',
            'cost_price' => 3000,
            'selling_price' => 8000,
            'stock_qty' => 10,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin)->post('/admin/products/stock-adjustments', [
            'product_id' => $product->id,
            'movement_type' => 'in',
            'quantity_change' => 5,
            'notes' => 'Restock kopi sachet',
        ]);

        $response->assertStatus(302);
        $this->assertEquals(15, $product->fresh()->stock_qty);
    }

    public function test_admin_can_delete_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'barcode' => '777888999',
            'product_name' => 'Teh Manis Hangat',
            'cost_price' => 1000,
            'selling_price' => 4000,
            'stock_qty' => 20,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/products/{$product->id}");
        $response->assertStatus(302);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_admin_can_access_users_management(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/users');
        $response->assertStatus(200);
    }

    public function test_admin_can_create_new_user(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'full_name' => 'Ahmad Kasir 2',
            'username' => 'kasir2',
            'role' => 'kasir',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', [
            'username' => 'kasir2',
            'full_name' => 'Ahmad Kasir 2',
            'role' => 'kasir',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $targetUser = User::factory()->create([
            'username' => 'chef_budi',
            'full_name' => 'Budi Santoso',
            'role' => 'dapur',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->put("/admin/users/{$targetUser->id}", [
            'full_name' => 'Budi Santoso Head Chef',
            'username' => 'chef_budi',
            'role' => 'dapur',
            'password' => '',
            'is_active' => true,
        ]);

        $response->assertStatus(302);
        $this->assertEquals('Budi Santoso Head Chef', $targetUser->fresh()->full_name);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $targetUser = User::factory()->create([
            'username' => 'staff_inactive',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->patch("/admin/users/{$targetUser->id}/toggle-status");
        $response->assertStatus(302);
        $this->assertFalse($targetUser->fresh()->is_active);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $response = $this->actingAs($this->admin)->delete("/admin/users/{$this->admin->id}");
        $response->assertStatus(302);
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_admin_can_delete_another_user(): void
    {
        $targetUser = User::factory()->create([
            'username' => 'user_to_delete',
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/users/{$targetUser->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }
}
