<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardE2ETest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $cashier;

    protected User $chef;

    protected Category $category;

    protected Product $product;

    protected DiningTable $table;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'username' => 'admin_tester',
            'full_name' => 'Admin Utama',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->cashier = User::factory()->create([
            'username' => 'cashier_tester',
            'full_name' => 'Kasir POS',
            'role' => 'kasir',
            'is_active' => true,
        ]);

        $this->chef = User::factory()->create([
            'username' => 'chef_tester',
            'full_name' => 'Koki Dapur',
            'role' => 'dapur',
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'category_name' => 'Minuman Kopi',
            'slug' => 'minuman-kopi',
        ]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'barcode' => '8992001',
            'product_name' => 'Kopi Tubruk Robusta',
            'cost_price' => 5000,
            'selling_price' => 12000,
            'stock_qty' => 20,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $this->table = DiningTable::create([
            'table_number' => 'Meja VIP 1',
            'qr_code_token' => 'vip-table-token-12345',
            'status' => 'available',
        ]);
    }

    /**
     * 1. Guest is redirected to login
     */
    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $response = $this->get('/admin');
        $response->assertRedirect(route('login'));
    }

    /**
     * 2. Cashier is redirected to POS
     */
    public function test_cashier_cannot_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->cashier)->get('/admin');
        $response->assertRedirect(route('cashier.pos'));
        $response->assertSessionHas('error');
    }

    /**
     * 3. Chef is redirected to Kitchen Display
     */
    public function test_chef_cannot_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->chef)->get('/admin');
        $response->assertRedirect(route('kitchen.display'));
        $response->assertSessionHas('error');
    }

    /**
     * 4. Admin successfully renders Dashboard with full metrics, tabs, and models
     */
    public function test_admin_can_access_dashboard_with_all_metrics(): void
    {
        // Create sample order to verify metric aggregation
        $order = Order::create([
            'table_id' => $this->table->id,
            'cashier_id' => $this->cashier->id,
            'invoice_number' => 'INV-TEST-001',
            'token_number' => '001',
            'order_source' => 'cashier_direct',
            'total_amount' => 24000,
            'total_cost' => 10000,
            'amount_received' => 50000,
            'change_amount' => 26000,
            'payment_method' => 'tunai',
            'payment_status' => 'paid',
            'order_status' => 'served',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price' => 12000,
            'unit_cost' => 5000,
            'subtotal' => 24000,
            'item_status' => 'served',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('summary_metrics')
            ->has('products')
            ->has('categories')
            ->has('dining_tables')
            ->has('cashier_shifts')
            ->has('recent_orders')
            ->where('summary_metrics.gross_revenue', 24000)
            ->where('summary_metrics.net_profit', 14000)
            ->where('summary_metrics.total_orders_count', 1)
        );
    }

    /**
     * 5. Dashboard date preset filtering (yesterday, this_week, this_month, custom date)
     */
    public function test_admin_dashboard_filtering_by_presets(): void
    {
        $responseYesterday = $this->actingAs($this->admin)->get('/admin?preset=yesterday');
        $responseYesterday->assertStatus(200);
        $responseYesterday->assertInertia(fn ($page) => $page
            ->where('filters.preset', 'yesterday')
        );

        $responseWeek = $this->actingAs($this->admin)->get('/admin?preset=this_week');
        $responseWeek->assertStatus(200);
        $responseWeek->assertInertia(fn ($page) => $page
            ->where('filters.preset', 'this_week')
        );

        $responseMonth = $this->actingAs($this->admin)->get('/admin?preset=this_month');
        $responseMonth->assertStatus(200);
        $responseMonth->assertInertia(fn ($page) => $page
            ->where('filters.preset', 'this_month')
        );

        $responseDate = $this->actingAs($this->admin)->get('/admin?date=2026-11-01');
        $responseDate->assertStatus(200);
        $responseDate->assertInertia(fn ($page) => $page
            ->where('filters.date', '2026-11-01')
        );
    }

    /**
     * 6. Product catalog search and filtering on dashboard
     */
    public function test_admin_dashboard_product_search_and_filters(): void
    {
        // Search query
        $responseSearch = $this->actingAs($this->admin)->get('/admin?search=Robusta');
        $responseSearch->assertStatus(200);

        // Category filter
        $responseCat = $this->actingAs($this->admin)->get('/admin?category_id='.$this->category->id);
        $responseCat->assertStatus(200);

        // Requires kitchen filter
        $responseKitchen = $this->actingAs($this->admin)->get('/admin?requires_kitchen=true');
        $responseKitchen->assertStatus(200);

        // Stock status filter
        $responseStock = $this->actingAs($this->admin)->get('/admin?stock_status=out_of_stock');
        $responseStock->assertStatus(200);
    }

    /**
     * 7. Admin can adjust stock from Dashboard
     */
    public function test_admin_can_adjust_stock_from_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/stock-adjustments', [
            'product_id' => $this->product->id,
            'movement_type' => 'in',
            'quantity_change' => 15,
            'notes' => 'Restock biji kopi dari supplier',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $this->assertEquals(35, $this->product->fresh()->stock_qty);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'movement_type' => 'in',
            'quantity_change' => 15,
        ]);
    }

    /**
     * 8. Admin can create new category from Dashboard
     */
    public function test_admin_can_create_category_from_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/categories', [
            'category_name' => 'Pastry & Croissant',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('categories', [
            'category_name' => 'Pastry & Croissant',
        ]);

        // Duplicate name fails
        $responseDup = $this->actingAs($this->admin)->post('/admin/categories', [
            'category_name' => 'Pastry & Croissant',
        ]);
        $responseDup->assertSessionHasErrors(['category_name']);
    }

    /**
     * 9. Admin can update table status from Dashboard
     */
    public function test_admin_can_update_table_status_from_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->patch("/admin/tables/{$this->table->id}/status", [
            'status' => 'occupied',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $this->assertEquals('occupied', $this->table->fresh()->status);

        // Invalid status fails
        $responseInvalid = $this->actingAs($this->admin)->patch("/admin/tables/{$this->table->id}/status", [
            'status' => 'broken',
        ]);
        $responseInvalid->assertSessionHasErrors(['status']);
    }

    /**
     * 10. Admin can export orders CSV
     */
    public function test_admin_can_export_orders_csv(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/export/excel?type=orders');

        $response->assertStatus(200);
        $this->assertTrue(str_contains((string) $response->headers->get('content-type'), 'text/csv'));
    }

    /**
     * 11. Admin can export shifts CSV
     */
    public function test_admin_can_export_shifts_csv(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/export/excel?type=shifts');

        $response->assertStatus(200);
        $this->assertTrue(str_contains((string) $response->headers->get('content-type'), 'text/csv'));
    }

    /**
     * 12. Admin can export PDF report view
     */
    public function test_admin_can_export_pdf_report(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/export/pdf');

        $response->assertStatus(200);
        $response->assertViewIs('reports.executive_pdf');
        $response->assertViewHasAll(['summary_metrics', 'recent_orders', 'cashier_shifts', 'generated_at']);
    }

    /**
     * 13. Admin can update product details from dashboard
     */
    public function test_admin_can_update_product_from_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->put("/admin/products/{$this->product->id}", [
            'category_id' => $this->category->id,
            'barcode' => '8992001',
            'product_name' => 'Kopi Tubruk Robusta Premium',
            'cost_price' => 6000,
            'selling_price' => 15000,
            'stock_qty' => 18,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $this->assertEquals('Kopi Tubruk Robusta Premium', $this->product->fresh()->product_name);
        $this->assertEquals(15000, $this->product->fresh()->selling_price);
    }

    /**
     * 14. Admin can delete product from dashboard
     */
    public function test_admin_can_delete_product_from_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->delete("/admin/products/{$this->product->id}");

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $this->assertSoftDeleted('products', ['id' => $this->product->id]);
    }
}
