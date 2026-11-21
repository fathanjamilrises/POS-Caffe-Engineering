<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TableAndCustomerQrTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic category and dining tables
        Category::create([
            'category_name' => 'Makanan Utama',
            'slug' => 'makanan-utama',
        ]);

        DiningTable::create([
            'table_number' => 'Meja 1',
            'qr_code_token' => 'sample_token_meja_1_abcdefghijk',
            'status' => 'available',
        ]);

        Product::create([
            'category_id' => 1,
            'barcode' => '89999001',
            'product_name' => 'Nasi Goreng Spesial',
            'cost_price' => 15000,
            'selling_price' => 25000,
            'stock_qty' => 20,
            'requires_kitchen' => true,
            'is_available' => true,
        ]);
    }

    public function test_authenticated_admin_can_access_tables_management(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/tables');

        $response->assertStatus(200);
    }

    public function test_authenticated_cashier_can_access_tables_management(): void
    {
        $cashier = User::factory()->create(['role' => 'kasir']);

        $response = $this->actingAs($cashier)->get('/tables');

        $response->assertStatus(200);
    }

    public function test_public_customer_can_view_table_menu(): void
    {
        $table = DiningTable::first();

        $response = $this->get("/table/{$table->qr_code_token}");

        $response->assertStatus(200);
    }

    public function test_public_customer_can_place_order_and_dispatch_kds(): void
    {
        $table = DiningTable::first();
        $product = Product::first();

        $initialStock = $product->stock_qty;

        $response = $this->post("/table/{$table->qr_code_token}/order", [
            'customer_name' => 'Budi Pelanggan QR',
            'payment_method' => 'qris',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'notes' => 'Tidak terlalu manis',
                ],
            ],
        ]);

        $response->assertStatus(302);

        // Verify stock deducted / reserved
        $this->assertEquals($initialStock - 2, $product->fresh()->stock_qty);

        // Verify table marked occupied
        $this->assertEquals('occupied', $table->fresh()->status);

        // Verify Order created with status pending and payment unpaid (awaiting cashier verification)
        $order = Order::latest()->first();
        $this->assertEquals('pending', $order->order_status);
        $this->assertEquals('unpaid', $order->payment_status);
        $this->assertEquals('qr_table', $order->order_source);
        $this->assertEquals('Budi Pelanggan QR', $order->customer_name);
        $this->assertEquals(50000, $order->total_amount);

        // Verify Kitchen ticket is NOT dispatched yet before cashier confirmation
        $this->assertDatabaseMissing('kitchen_tickets', ['order_id' => $order->id]);

        // Verify customer can access their status page
        $statusResponse = $this->get("/table/{$table->qr_code_token}/status/{$order->id}");
        $statusResponse->assertStatus(200);

        // Cashier confirms and accepts payment for the QR table order
        $cashier = User::factory()->create(['role' => 'kasir']);
        $confirmResponse = $this->actingAs($cashier)->post("/pos/orders/{$order->id}/confirm-payment", [
            'payment_method' => 'qris',
        ]);
        $confirmResponse->assertStatus(302);

        // Order is now confirmed and paid
        $freshOrder = $order->fresh();
        $this->assertEquals('processing', $freshOrder->order_status);
        $this->assertEquals('paid', $freshOrder->payment_status);

        // Kitchen ticket is now dispatched to KDS
        $ticket = KitchenTicket::where('order_id', $order->id)->first();
        $this->assertNotNull($ticket);
        $this->assertEquals('waiting', $ticket->ticket_status);
    }

    public function test_cashier_can_cancel_pending_qr_order_and_restore_stock(): void
    {
        $table = DiningTable::first();
        $product = Product::first();
        $initialStock = $product->stock_qty;

        $this->post("/table/{$table->qr_code_token}/order", [
            'customer_name' => 'Tamu Batal',
            'payment_method' => 'tunai',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ]);

        $this->assertEquals($initialStock - 3, $product->fresh()->stock_qty);
        $order = Order::latest()->first();

        // Cashier cancels the order
        $cashier = User::factory()->create(['role' => 'kasir']);
        $cancelResponse = $this->actingAs($cashier)->post("/pos/orders/{$order->id}/cancel", [
            'reason' => 'Tamu tidak ada di meja',
        ]);
        $cancelResponse->assertStatus(302);

        // Verify stock is restored
        $this->assertEquals($initialStock, $product->fresh()->stock_qty);

        // Verify order is cancelled
        $this->assertEquals('cancelled', $order->fresh()->order_status);

        // Verify table is released back to available
        $this->assertEquals('available', $table->fresh()->status);
    }

    public function test_admin_can_toggle_table_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $table = DiningTable::first();

        $response = $this->actingAs($admin)->patch("/tables/{$table->id}/status", [
            'status' => 'occupied',
        ]);

        $response->assertStatus(302);
        $this->assertEquals('occupied', $table->fresh()->status);
    }

    public function test_admin_can_regenerate_qr_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $table = DiningTable::first();
        $oldToken = $table->qr_code_token;

        $response = $this->actingAs($admin)->post("/tables/{$table->id}/regenerate-qr");

        $response->assertStatus(302);
        $this->assertNotEquals($oldToken, $table->fresh()->qr_code_token);
    }

    public function test_admin_can_add_new_dining_table(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/tables', [
            'table_number' => 'VIP 01',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('dining_tables', [
            'table_number' => 'VIP 01',
            'status' => 'available',
        ]);
    }

    public function test_customer_can_call_waiter_from_qr(): void
    {
        $table = DiningTable::first();

        $response = $this->post("/table/{$table->qr_code_token}/call-waiter", [
            'assistance_type' => 'cutlery',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
    }
}
