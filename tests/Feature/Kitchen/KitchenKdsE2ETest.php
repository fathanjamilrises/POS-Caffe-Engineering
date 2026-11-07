<?php

namespace Tests\Feature\Kitchen;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class KitchenKdsE2ETest extends TestCase
{
    use RefreshDatabase;

    protected User $chef;

    protected User $cashier;

    protected User $admin;

    protected Category $category;

    protected Product $food;

    protected DiningTable $table;

    protected Order $order;

    protected OrderItem $orderItem;

    protected KitchenTicket $ticket;

    protected function setUp(): void
    {
        parent::setUp();

        $this->chef = User::factory()->create([
            'username' => 'chef_utama',
            'full_name' => 'Chef Ragil',
            'role' => 'dapur',
            'is_active' => true,
        ]);

        $this->cashier = User::factory()->create([
            'username' => 'kasir_resto',
            'full_name' => 'Kasir Anisa',
            'role' => 'kasir',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'username' => 'admin_resto',
            'full_name' => 'Admin Boss',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'category_name' => 'Main Course',
            'slug' => 'main-course',
        ]);

        $this->food = Product::create([
            'category_id' => $this->category->id,
            'barcode' => '8993001',
            'product_name' => 'Steak Daging Sapi',
            'cost_price' => 45000,
            'selling_price' => 75000,
            'stock_qty' => 10,
            'requires_kitchen' => true,
            'is_available' => true,
        ]);

        $this->table = DiningTable::create([
            'table_number' => 'Meja KDS 1',
            'capacity' => 2,
            'qr_code_token' => 'qr_kds_table_token_123',
            'status' => 'occupied',
        ]);

        $this->order = Order::create([
            'invoice_number' => 'INV-KDS-001',
            'token_number' => '012',
            'table_id' => $this->table->id,
            'customer_name' => 'Tamu KDS',
            'order_source' => 'qr_table',
            'order_status' => 'processing',
            'payment_method' => 'qris',
            'payment_status' => 'paid',
            'total_cost' => 45000,
            'total_amount' => 75000,
            'amount_received' => 75000,
            'change_amount' => 0,
        ]);

        $this->orderItem = OrderItem::create([
            'order_id' => $this->order->id,
            'product_id' => $this->food->id,
            'quantity' => 1,
            'unit_cost' => 45000,
            'unit_price' => 75000,
            'subtotal' => 75000,
            'notes' => 'Tingkat kematangan medium well',
            'item_status' => 'queued_kds',
        ]);

        $this->ticket = KitchenTicket::create([
            'order_id' => $this->order->id,
            'order_item_id' => $this->orderItem->id,
            'token_number' => $this->order->token_number,
            'ticket_status' => 'waiting',
            'is_audio_notified' => false,
            'sent_to_kds_at' => now(),
        ]);
    }

    /**
     * Test 1: Tamu tak login diarahkan ke login.
     */
    public function test_guest_cannot_access_kitchen_and_is_redirected_to_login(): void
    {
        $response = $this->get('/kitchen');

        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /**
     * Test 2: Admin dan Kasir diblokir dari layar dapur dan diarahkan ke layar masing-masing.
     */
    public function test_admin_and_cashier_cannot_access_kitchen_and_are_redirected(): void
    {
        $adminResp = $this->actingAs($this->admin)->get('/kitchen');
        $adminResp->assertStatus(302);
        $adminResp->assertRedirect(route('admin.dashboard'));

        $cashierResp = $this->actingAs($this->cashier)->get('/kitchen');
        $cashierResp->assertStatus(302);
        $cashierResp->assertRedirect(route('cashier.pos'));
    }

    /**
     * Test 3: Koki dapat membuka layar KDS dengan daftar antrean tiket aktif.
     */
    public function test_chef_can_access_kitchen_display_with_tickets(): void
    {
        $response = $this->actingAs($this->chef)->get('/kitchen');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Kitchen/Display')
            ->has('tickets', 1)
            ->where('unnotified_count', 1)
        );
    }

    /**
     * Test 4: Koki dapat memperbarui status tiket menjadi 'cooking'.
     */
    public function test_chef_can_progress_ticket_status_to_cooking(): void
    {
        $response = $this->actingAs($this->chef)->post("/kitchen/tickets/{$this->ticket->id}/status", [
            'status' => 'cooking',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $freshTicket = $this->ticket->fresh();
        $this->assertEquals('cooking', $freshTicket->ticket_status);
        $this->assertEquals($this->chef->id, $freshTicket->chef_id);

        $this->assertEquals('cooking', $this->orderItem->fresh()->item_status);
    }

    /**
     * Test 5: Koki menyelesaikan masakan menjadi 'delivered_to_cashier', otomatis mengubah order menjadi 'ready'.
     */
    public function test_chef_can_progress_ticket_to_delivered_to_cashier(): void
    {
        $response = $this->actingAs($this->chef)->post("/kitchen/tickets/{$this->ticket->id}/status", [
            'status' => 'delivered_to_cashier',
        ]);

        $response->assertStatus(302);

        $freshTicket = $this->ticket->fresh();
        $this->assertEquals('delivered_to_cashier', $freshTicket->ticket_status);
        $this->assertNotNull($freshTicket->completed_at);

        $this->assertEquals('delivered_to_cashier', $this->orderItem->fresh()->item_status);

        // Karena semua tiket pesanan telah selesai dimasak, status induk order berubah menjadi 'ready'
        $this->assertEquals('ready', $this->order->fresh()->order_status);
    }

    /**
     * Test 6: Koki dapat mengonfirmasi alarm audio lonceng KDS (acknowledge-audio).
     */
    public function test_chef_can_acknowledge_audio_alerts(): void
    {
        $this->assertFalse((bool) $this->ticket->fresh()->is_audio_notified);

        $response = $this->actingAs($this->chef)->post('/kitchen/acknowledge-audio');

        $response->assertStatus(302);
        $this->assertTrue((bool) $this->ticket->fresh()->is_audio_notified);
    }

    /**
     * Test 7: Permintaan API JSON dari role tidak sah ke /kitchen mengembalikan 403 Forbidden.
     */
    public function test_unauthorized_role_api_json_request_to_kitchen_returns_403(): void
    {
        $response = $this->actingAs($this->cashier)->getJson('/kitchen');

        $response->assertStatus(403);
        $response->assertJsonStructure(['message']);
    }

    /**
     * Test 8: Validasi status tiket menolak status di luar whitelist.
     */
    public function test_invalid_ticket_status_transition_is_rejected(): void
    {
        $response = $this->actingAs($this->chef)->post("/kitchen/tickets/{$this->ticket->id}/status", [
            'status' => 'invalid_status_random',
        ]);

        $response->assertSessionHasErrors(['status']);
        $this->assertEquals('waiting', $this->ticket->fresh()->ticket_status);
    }

    /**
     * Test 9: Memulai proses memasak tiket (cooking) otomatis mematikan alarm audio (is_audio_notified = true).
     */
    public function test_progressing_to_cooking_automatically_acknowledges_audio_alert(): void
    {
        $this->assertFalse((bool) $this->ticket->fresh()->is_audio_notified);

        $response = $this->actingAs($this->chef)->post("/kitchen/tickets/{$this->ticket->id}/status", [
            'status' => 'cooking',
        ]);

        $response->assertStatus(302);
        $fresh = $this->ticket->fresh();
        $this->assertEquals('cooking', $fresh->ticket_status);
        $this->assertTrue((bool) $fresh->is_audio_notified);
    }

    /**
     * Test 10: Pesanan yang telah diserahkan (served) oleh kasir otomatis hilang dari antrean aktif KDS.
     */
    public function test_served_orders_are_excluded_from_active_kds_tickets(): void
    {
        // Awalnya tiket aktif muncul
        $respBefore = $this->actingAs($this->chef)->get('/kitchen');
        $respBefore->assertInertia(fn (Assert $page) => $page->has('tickets', 1));

        // Kasir menyerahkan pesanan (order_status = served)
        $this->order->update(['order_status' => 'served']);
        $this->ticket->update(['ticket_status' => 'completed']);

        // Tiket sekarang tidak lagi tampil di layar antrean KDS
        $respAfter = $this->actingAs($this->chef)->get('/kitchen');
        $respAfter->assertInertia(fn (Assert $page) => $page->has('tickets', 0));
    }

    /**
     * Test 11: Sinkronisasi pesanan multi-tiket (order tetap 'processing' hingga semua masakan selesai).
     */
    public function test_multiticket_order_status_progression(): void
    {
        // Tambahkan tiket kedua pada pesanan yang sama
        $item2 = OrderItem::create([
            'order_id' => $this->order->id,
            'product_id' => $this->food->id,
            'quantity' => 1,
            'unit_cost' => 45000,
            'unit_price' => 75000,
            'subtotal' => 75000,
            'item_status' => 'queued_kds',
        ]);

        $ticket2 = KitchenTicket::create([
            'order_id' => $this->order->id,
            'order_item_id' => $item2->id,
            'token_number' => $this->order->token_number,
            'ticket_status' => 'waiting',
            'is_audio_notified' => false,
            'sent_to_kds_at' => now(),
        ]);

        // Tiket 1 diantar ke kasir
        $this->actingAs($this->chef)->post("/kitchen/tickets/{$this->ticket->id}/status", [
            'status' => 'delivered_to_cashier',
        ]);

        // Induk order MASIH 'processing' karena tiket 2 masih menunggu
        $this->assertEquals('processing', $this->order->fresh()->order_status);

        // Tiket 2 juga diantar ke kasir
        $this->actingAs($this->chef)->post("/kitchen/tickets/{$ticket2->id}/status", [
            'status' => 'delivered_to_cashier',
        ]);

        // Sekarang semua tiket selesai masak, induk order berubah menjadi 'ready'
        $this->assertEquals('ready', $this->order->fresh()->order_status);
    }
}
