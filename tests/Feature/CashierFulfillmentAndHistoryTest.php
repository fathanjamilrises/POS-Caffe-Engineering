<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\KitchenKdsService;
use App\Services\PosOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierFulfillmentAndHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;

    protected User $chef;

    protected Product $cookedProduct;

    protected Product $instantProduct;

    protected DiningTable $table;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create([
            'role' => 'kasir',
            'username' => 'kasir_pos_test',
        ]);

        $this->chef = User::factory()->create([
            'role' => 'dapur',
            'username' => 'chef_kds_test',
        ]);

        $category = Category::create([
            'category_name' => 'Makanan Utama',
            'slug' => 'makanan-utama',
        ]);

        $this->cookedProduct = Product::create([
            'category_id' => $category->id,
            'barcode' => '89999001',
            'product_name' => 'Mie Goreng Spesial',
            'cost_price' => 10000,
            'selling_price' => 20000,
            'stock_qty' => 15,
            'requires_kitchen' => true,
            'is_available' => true,
        ]);

        $this->instantProduct = Product::create([
            'category_id' => $category->id,
            'barcode' => '89999002',
            'product_name' => 'Teh Botol Sosro',
            'cost_price' => 3000,
            'selling_price' => 6000,
            'stock_qty' => 30,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $this->table = DiningTable::create([
            'table_number' => 'Meja 5',
            'qr_code_token' => 'token_meja_5_fulfillment',
            'status' => 'available',
        ]);
    }

    public function test_cashier_pos_displays_fulfillment_and_recent_transactions(): void
    {
        $response = $this->actingAs($this->cashier)->get('/pos');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Cashier/Pos')
            ->has('fulfillment_orders')
            ->has('recent_transactions')
        );
    }

    public function test_processing_order_is_not_in_fulfillment_until_kitchen_confirms(): void
    {
        /** @var PosOrderService $posService */
        $posService = app(PosOrderService::class);
        /** @var KitchenKdsService $kdsService */
        $kdsService = app(KitchenKdsService::class);

        // 1. Create order requiring kitchen
        $order = $posService->createPosOrder([
            'items' => [
                ['product_id' => $this->cookedProduct->id, 'quantity' => 2],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 40000,
            'table_id' => $this->table->id,
            'customer_name' => 'Pelanggan Meja 5',
            'order_source' => 'qr_table',
        ], $this->cashier->id);

        $this->assertEquals('processing', $order->order_status);

        // Verify order is NOT yet in fulfillment orders while processing
        $fulfillmentOrders = $posService->getFulfillmentOrders();
        $this->assertFalse($fulfillmentOrders->contains('id', $order->id), 'Processing order must NOT appear in ready fulfillment orders.');

        // Verify order is visible in recent transactions with processing status
        $recentTransactions = $posService->getRecentTransactions();
        $this->assertTrue($recentTransactions->contains('id', $order->id));
        $this->assertEquals('processing', $recentTransactions->firstWhere('id', $order->id)->order_status);

        // 2. Kitchen progresses ticket: waiting -> cooking -> delivered_to_cashier
        $ticket = KitchenTicket::where('order_id', $order->id)->first();
        $this->assertNotNull($ticket);

        $kdsService->updateTicketStatus($ticket->id, 'cooking', $this->chef->id);
        $this->assertFalse($posService->getFulfillmentOrders()->contains('id', $order->id));

        // Kitchen delivers to cashier
        $kdsService->updateTicketStatus($ticket->id, 'delivered_to_cashier', $this->chef->id);

        // Now order must be 'ready' and MUST appear in fulfillment orders!
        $this->assertEquals('ready', $order->fresh()->order_status);
        $readyOrders = $posService->getFulfillmentOrders();
        $this->assertTrue($readyOrders->contains('id', $order->id), 'Ready order confirmed by kitchen MUST appear in fulfillment orders.');

        // 3. Cashier confirms handshake / serves the order
        $serveResponse = $this->actingAs($this->cashier)->post("/pos/orders/{$order->id}/serve");
        $serveResponse->assertStatus(302);

        $this->assertEquals('served', $order->fresh()->order_status);
        $this->assertEquals('completed', $ticket->fresh()->ticket_status, 'Kitchen ticket must be marked completed upon cashier serve.');
        $this->assertNotNull($ticket->fresh()->completed_at, 'Kitchen ticket completed_at timestamp must be recorded.');
        $this->assertFalse($posService->getFulfillmentOrders()->contains('id', $order->id), 'Served order must disappear from fulfillment queue.');
    }

    public function test_instant_cashier_order_is_marked_served_immediately_without_kitchen_queue(): void
    {
        /** @var PosOrderService $posService */
        $posService = app(PosOrderService::class);

        // Direct POS order with only instant drinks
        $order = $posService->createPosOrder([
            'items' => [
                ['product_id' => $this->instantProduct->id, 'quantity' => 1],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 10000,
            'table_id' => null,
            'customer_name' => 'Walk-in Drink',
            'order_source' => 'cashier_direct',
        ], $this->cashier->id);

        // Direct instant order is served immediately, no kitchen tickets
        $this->assertEquals('served', $order->order_status);
        $this->assertDatabaseMissing('kitchen_tickets', ['order_id' => $order->id]);
        $this->assertFalse($posService->getFulfillmentOrders()->contains('id', $order->id));
    }

    public function test_kitchen_kds_screen_loads_and_chef_can_progress_ticket(): void
    {
        /** @var PosOrderService $posService */
        $posService = app(PosOrderService::class);

        $order = $posService->createPosOrder([
            'items' => [
                ['product_id' => $this->cookedProduct->id, 'quantity' => 2, 'notes' => 'Telor dadar pedas'],
                ['product_id' => $this->instantProduct->id, 'quantity' => 1],
            ],
            'payment_method' => 'qris',
            'amount_received' => 50000,
            'table_id' => $this->table->id,
            'customer_name' => 'Meja Tiga KDS',
            'order_source' => 'qr_table',
        ]);

        $ticket = KitchenTicket::where('order_id', $order->id)->first();
        $this->assertNotNull($ticket);
        $this->assertEquals('waiting', $ticket->ticket_status);

        // Chef views kitchen screen
        $response = $this->actingAs($this->chef)->get('/kitchen');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Kitchen/Display')
            ->has('tickets')
            ->has('unnotified_count')
        );

        // Chef silences audio
        $ackResponse = $this->actingAs($this->chef)->post('/kitchen/acknowledge-audio');
        $ackResponse->assertStatus(302);
        $this->assertTrue($ticket->fresh()->is_audio_notified);

        // Chef progresses ticket to cooking
        $cookingResponse = $this->actingAs($this->chef)->post("/kitchen/tickets/{$ticket->id}/status", [
            'status' => 'cooking',
        ]);
        $cookingResponse->assertStatus(302);
        $this->assertEquals('cooking', $ticket->fresh()->ticket_status);

        // Chef finishes cooking and brings to cashier counter
        $deliverResponse = $this->actingAs($this->chef)->post("/kitchen/tickets/{$ticket->id}/status", [
            'status' => 'delivered_to_cashier',
        ]);
        $deliverResponse->assertStatus(302);
        $this->assertEquals('delivered_to_cashier', $ticket->fresh()->ticket_status);
        $this->assertEquals('ready', $order->fresh()->order_status);
    }
}
