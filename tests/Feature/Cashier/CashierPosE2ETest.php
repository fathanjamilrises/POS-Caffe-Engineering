<?php

namespace Tests\Feature\Cashier;

use App\Models\CashierShift;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CashierPosE2ETest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;

    protected User $admin;

    protected User $chef;

    protected Category $foodCategory;

    protected Category $drinkCategory;

    protected Product $cookedFood;

    protected Product $instantDrink;

    protected DiningTable $table;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create([
            'username' => 'kasir_terminal',
            'full_name' => 'Siti Kasir Utama',
            'role' => 'kasir',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'username' => 'admin_super',
            'full_name' => 'Budi Supervisor',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->chef = User::factory()->create([
            'username' => 'chef_resto',
            'full_name' => 'Chef Junaedi',
            'role' => 'dapur',
            'is_active' => true,
        ]);

        $this->foodCategory = Category::create([
            'category_name' => 'Makanan Hangat',
            'slug' => 'makanan-hangat',
        ]);

        $this->drinkCategory = Category::create([
            'category_name' => 'Minuman Dingin',
            'slug' => 'minuman-dingin',
        ]);

        $this->cookedFood = Product::create([
            'category_id' => $this->foodCategory->id,
            'barcode' => '8991001001',
            'product_name' => 'Nasi Goreng Wagyu',
            'cost_price' => 20000,
            'selling_price' => 35000,
            'stock_qty' => 15,
            'requires_kitchen' => true,
            'is_available' => true,
        ]);

        $this->instantDrink = Product::create([
            'category_id' => $this->drinkCategory->id,
            'barcode' => '8991001002',
            'product_name' => 'Es Kopi Susu Gula Aren',
            'cost_price' => 8000,
            'selling_price' => 18000,
            'stock_qty' => 25,
            'requires_kitchen' => false,
            'is_available' => true,
        ]);

        $this->table = DiningTable::create([
            'table_number' => 'Meja 05',
            'capacity' => 4,
            'qr_code_token' => 'qr_token_meja_05_secret_123',
            'status' => 'available',
        ]);
    }

    /**
     * Test 1: Tamu tak terautentikasi (Guest) diarahkan ke login saat mengakses /pos.
     */
    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/pos');

        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /**
     * Test 2: Admin dan Koki diblokir dari /pos dan diarahkan ke layar masing-masing.
     */
    public function test_admin_and_chef_cannot_access_pos_and_are_redirected(): void
    {
        // Admin diarahkan ke dasbor admin
        $adminResponse = $this->actingAs($this->admin)->get('/pos');
        $adminResponse->assertStatus(302);
        $adminResponse->assertRedirect(route('admin.dashboard'));
        $adminResponse->assertSessionHas('error');

        // Koki diarahkan ke layar KDS dapur
        $chefResponse = $this->actingAs($this->chef)->get('/pos');
        $chefResponse->assertStatus(302);
        $chefResponse->assertRedirect(route('kitchen.display'));
        $chefResponse->assertSessionHas('error');
    }

    /**
     * Test 3: Permintaan API JSON dari role tidak berhak mengembalikan status HTTP 403 Forbidden.
     */
    public function test_unauthorized_role_api_json_request_returns_403(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/pos');

        $response->assertStatus(403);
        $response->assertJsonStructure(['message']);
    }

    /**
     * Test 4: Staf kasir dapat membuka layar POS dengan data lengkap Inertia.
     */
    public function test_cashier_can_access_pos_terminal_with_complete_props(): void
    {
        $response = $this->actingAs($this->cashier)->get('/pos');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Cashier/Pos')
            ->has('products', 2)
            ->has('categories', 2)
            ->has('dining_tables', 1)
            ->has('fulfillment_orders')
            ->where('active_shift', null)
        );
    }

    /**
     * Test 5: Kasir dapat membuka sesi shift baru dengan modal awal.
     */
    public function test_cashier_can_open_shift_session(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos/shift/open', [
            'shift_name' => 'Shift Siang Kasir A',
            'opening_cash' => 250000,
            'notes' => 'Uang pecahan kecil Rp 5.000 dan Rp 10.000 tersedia.',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('cashier_shifts', [
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Siang Kasir A',
            'opening_cash' => 250000,
            'closed_at' => null,
        ]);
    }

    /**
     * Test 6: Membuka shift baru otomatis menutup shift lama yang masih menggantung.
     */
    public function test_opening_new_shift_auto_closes_previous_active_shift(): void
    {
        $oldShift = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Pagi Lama',
            'opened_at' => now()->subHours(6),
            'opening_cash' => 150000,
            'total_cash_sales' => 500000,
            'total_qris_sales' => 200000,
        ]);

        $this->assertNull($oldShift->fresh()->closed_at);

        $response = $this->actingAs($this->cashier)->post('/pos/shift/open', [
            'shift_name' => 'Shift Baru',
            'opening_cash' => 200000,
        ]);

        $response->assertStatus(302);
        $this->assertNotNull($oldShift->fresh()->closed_at);

        $this->assertDatabaseHas('cashier_shifts', [
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Baru',
            'closed_at' => null,
        ]);
    }

    /**
     * Test 7: Kasir dapat menutup shift aktif dan mencatat kas aktual.
     */
    public function test_cashier_can_close_active_shift(): void
    {
        $shift = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Sore',
            'opened_at' => now()->subHours(4),
            'opening_cash' => 200000,
            'total_cash_sales' => 350000,
            'total_qris_sales' => 180000,
        ]);

        $response = $this->actingAs($this->cashier)->post("/pos/shift/{$shift->id}/close", [
            'closing_cash_actual' => 550000,
            'notes' => 'Kas fisik cocok persis dengan total modal + penjualan tunai.',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $fresh = $shift->fresh();
        $this->assertNotNull($fresh->closed_at);
        $this->assertEquals(550000, (float) $fresh->closing_cash_actual);
        $this->assertEquals(0, (float) $fresh->discrepancy);
    }

    /**
     * Test 8: Validasi pembukaan dan penutupan shift (input wajib & tidak boleh negatif).
     */
    public function test_shift_validation_prevents_invalid_cash_amounts(): void
    {
        // Validasi buka shift: opening_cash negatif
        $responseOpen = $this->actingAs($this->cashier)->post('/pos/shift/open', [
            'shift_name' => '',
            'opening_cash' => -50000,
        ]);
        $responseOpen->assertSessionHasErrors(['shift_name', 'opening_cash']);

        // Validasi tutup shift: closing_cash_actual negatif
        $shift = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Uji',
            'opened_at' => now(),
            'opening_cash' => 100000,
        ]);

        $responseClose = $this->actingAs($this->cashier)->post("/pos/shift/{$shift->id}/close", [
            'closing_cash_actual' => -100,
        ]);
        $responseClose->assertSessionHasErrors(['closing_cash_actual']);
    }

    /**
     * Test 9: Checkout transaksi Tunai berhasil, kalkulasi kembalian tepat, stok terpotong & rekap shift bertambah.
     */
    public function test_cash_checkout_computes_change_and_deducts_stock_accurately(): void
    {
        $shift = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Aktif',
            'opened_at' => now(),
            'opening_cash' => 200000,
            'total_cash_sales' => 0,
            'total_qris_sales' => 0,
        ]);

        $initialStock = $this->cookedFood->stock_qty; // 15
        $orderQty = 2; // total = 70.000
        $amountReceived = 100000;
        $expectedChange = 30000;

        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->cookedFood->id,
                    'quantity' => $orderQty,
                    'notes' => 'Pedas sedang, tanpa timun',
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => $amountReceived,
            'table_id' => $this->table->id,
            'customer_name' => 'Bapak Joko',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        // Pastikan order tersimpan
        $order = Order::where('customer_name', 'Bapak Joko')->first();
        $this->assertNotNull($order);
        $this->assertEquals(70000, (float) $order->total_amount);
        $this->assertEquals($amountReceived, (float) $order->amount_received);
        $this->assertEquals($expectedChange, (float) $order->change_amount);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals($shift->id, $order->shift_id);
        $this->assertEquals($this->table->id, $order->table_id);

        // Pastikan stok terpotong
        $this->assertEquals($initialStock - $orderQty, $this->cookedFood->fresh()->stock_qty);

        // Pastikan kartu stok StockMovement tercatat
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->cookedFood->id,
            'movement_type' => 'out',
            'quantity_change' => -$orderQty,
        ]);

        // Rekap shift kasir bertambah
        $this->assertEquals(70000, (float) $shift->fresh()->total_cash_sales);
    }

    /**
     * Test 10: Pembayaran tunai dengan uang kurang (underpayment) diblokir secara ketat.
     */
    public function test_underpayment_in_cash_is_strictly_blocked(): void
    {
        $initialStock = $this->cookedFood->stock_qty;

        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->cookedFood->id,
                    'quantity' => 2, // Total 70.000
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 50000, // Kurang 20.000
            'customer_name' => 'Pelanggan Kurang Bayar',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertSessionHasErrors(['amount_received']);

        // Pastikan tidak ada order yang dibuat
        $this->assertDatabaseMissing('orders', [
            'customer_name' => 'Pelanggan Kurang Bayar',
        ]);

        // Stok tidak berubah
        $this->assertEquals($initialStock, $this->cookedFood->fresh()->stock_qty);
    }

    /**
     * Test 11: Checkout QRIS otomatis mengatur amount_received = total_amount & change_amount = 0.
     */
    public function test_qris_checkout_sets_exact_amount_and_updates_qris_shift_sales(): void
    {
        $shift = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift QRIS',
            'opened_at' => now(),
            'opening_cash' => 100000,
            'total_cash_sales' => 0,
            'total_qris_sales' => 0,
        ]);

        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->instantDrink->id,
                    'quantity' => 2, // Total 36.000
                ],
            ],
            'payment_method' => 'qris',
            'amount_received' => 36000,
            'customer_name' => 'Ibu Rina QRIS',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $order = Order::where('customer_name', 'Ibu Rina QRIS')->first();
        $this->assertNotNull($order);
        $this->assertEquals(36000, (float) $order->total_amount);
        $this->assertEquals(36000, (float) $order->amount_received);
        $this->assertEquals(0, (float) $order->change_amount);
        $this->assertEquals('qris', $order->payment_method);

        // Shift QRIS sales naik
        $this->assertEquals(36000, (float) $shift->fresh()->total_qris_sales);
        $this->assertEquals(0, (float) $shift->fresh()->total_cash_sales);
    }

    /**
     * Test 12: Routing pesanan dapur (requires_kitchen) menghasilkan tiket KDS dengan status waiting.
     */
    public function test_cooked_item_creates_kitchen_ticket_while_instant_item_skips_kds(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->cookedFood->id, // requires_kitchen = true
                    'quantity' => 1,
                    'notes' => 'Ekstra telur mata sapi',
                ],
                [
                    'product_id' => $this->instantDrink->id, // requires_kitchen = false
                    'quantity' => 1,
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 100000,
            'customer_name' => 'Bpk Handoko',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertStatus(302);

        $order = Order::where('customer_name', 'Bpk Handoko')->first();
        $this->assertNotNull($order);
        // Karena ada item masak, order status = processing
        $this->assertEquals('processing', $order->order_status);

        // Hanya item nasi goreng yang punya KitchenTicket
        $cookedItem = $order->items()->where('product_id', $this->cookedFood->id)->first();
        $instantItem = $order->items()->where('product_id', $this->instantDrink->id)->first();

        $this->assertEquals('queued_kds', $cookedItem->item_status);
        $this->assertEquals('instant', $instantItem->item_status);

        $ticket = KitchenTicket::where('order_item_id', $cookedItem->id)->first();
        $this->assertNotNull($ticket);
        $this->assertEquals('waiting', $ticket->ticket_status);
        $this->assertEquals($order->token_number, $ticket->token_number);

        // Minuman instan tidak punya KitchenTicket
        $this->assertDatabaseMissing('kitchen_tickets', [
            'order_item_id' => $instantItem->id,
        ]);
    }

    /**
     * Test 13: Pesanan yang hanya berisi produk instan langsung berstatus 'ready' tanpa tiket dapur.
     */
    public function test_purely_instant_order_becomes_ready_immediately_without_kds(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->instantDrink->id,
                    'quantity' => 1,
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 50000,
            'customer_name' => 'Instan Only',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertStatus(302);

        $order = Order::where('customer_name', 'Instan Only')->first();
        $this->assertNotNull($order);
        $this->assertEquals('ready', $order->order_status);

        $this->assertDatabaseMissing('kitchen_tickets', [
            'order_id' => $order->id,
        ]);
    }

    /**
     * Test 14: Checkout produk yang kuantitasnya melebihi sisa stok ditolak dengan pesan validasi.
     */
    public function test_checkout_exceeding_stock_is_rejected(): void
    {
        $this->cookedFood->update(['stock_qty' => 3]);

        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->cookedFood->id,
                    'quantity' => 5, // Minta 5 padahal stok cuma 3
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 200000,
            'customer_name' => 'Over Stock Requester',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertSessionHasErrors(['stock']);
        $this->assertDatabaseMissing('orders', [
            'customer_name' => 'Over Stock Requester',
        ]);
    }

    /**
     * Test 15: Handshake fulfillment kasir menyerahkan pesanan selesai (serve order).
     */
    public function test_cashier_can_mark_order_as_served(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-20261107-TEST1',
            'token_number' => '045',
            'cashier_id' => $this->cashier->id,
            'customer_name' => 'Pelanggan Siap Saji',
            'order_source' => 'cashier_direct',
            'order_status' => 'ready',
            'payment_method' => 'tunai',
            'payment_status' => 'paid',
            'total_cost' => 20000,
            'total_amount' => 35000,
            'amount_received' => 50000,
            'change_amount' => 15000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->cookedFood->id,
            'quantity' => 1,
            'unit_cost' => 20000,
            'unit_price' => 35000,
            'subtotal' => 35000,
            'item_status' => 'ready',
        ]);

        $response = $this->actingAs($this->cashier)->post("/pos/orders/{$order->id}/serve");

        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $this->assertEquals('served', $order->fresh()->order_status);
        $this->assertEquals('served', $item->fresh()->item_status);
    }

    /**
     * Test 16: Penutupan shift menghitung selisih kas (discrepancy) positif dan negatif dengan akurat.
     */
    public function test_shift_discrepancy_computed_accurately_for_shortage_and_surplus(): void
    {
        // Shift A: Selisih kurang Rp 20.000 (Modal 200rb + Penjualan 300rb = 500rb, fisik 480rb)
        $shiftShortage = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Kurang',
            'opened_at' => now()->subHours(5),
            'opening_cash' => 200000,
            'total_cash_sales' => 300000,
        ]);

        $this->actingAs($this->cashier)->post("/pos/shift/{$shiftShortage->id}/close", [
            'closing_cash_actual' => 480000,
            'notes' => 'Ada selisih kurang Rp 20.000',
        ]);

        $freshA = $shiftShortage->fresh();
        $this->assertEquals(500000, $freshA->expected_cash);
        $this->assertEquals(-20000, $freshA->discrepancy);

        // Shift B: Selisih lebih Rp 10.000 (Modal 100rb + Penjualan 100rb = 200rb, fisik 210rb)
        $shiftSurplus = CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'shift_name' => 'Shift Lebih',
            'opened_at' => now()->subHours(2),
            'opening_cash' => 100000,
            'total_cash_sales' => 100000,
        ]);

        $this->actingAs($this->cashier)->post("/pos/shift/{$shiftSurplus->id}/close", [
            'closing_cash_actual' => 210000,
            'notes' => 'Ada tips/kelebihan Rp 10.000',
        ]);

        $freshB = $shiftSurplus->fresh();
        $this->assertEquals(200000, $freshB->expected_cash);
        $this->assertEquals(10000, $freshB->discrepancy);
    }

    /**
     * Test 17: Status meja makan otomatis 'occupied' saat checkout meja, dan kembali 'available' saat pesanan diserahkan (served).
     */
    public function test_table_status_lifecycle_transitions_from_available_to_occupied_and_back(): void
    {
        $this->assertEquals('available', $this->table->fresh()->status);

        // Checkout menghubungkan meja 05
        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->instantDrink->id,
                    'quantity' => 1,
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 50000,
            'table_id' => $this->table->id,
            'customer_name' => 'Tamu Meja 05',
            'order_source' => 'qr_table',
        ]);

        $response->assertStatus(302);

        // Meja sekarang otomatis terisi (occupied)
        $this->assertEquals('occupied', $this->table->fresh()->status);

        $order = Order::where('customer_name', 'Tamu Meja 05')->first();
        $this->assertNotNull($order);

        // Kasir menyerahkan pesanan
        $this->actingAs($this->cashier)->post("/pos/orders/{$order->id}/serve");

        // Meja kembali tersedia (available)
        $this->assertEquals('available', $this->table->fresh()->status);
    }

    /**
     * Test 18: Menu yang dinonaktifkan (is_available = false) ditolak saat checkout meskipun stok fisik masih ada.
     */
    public function test_checkout_rejects_product_when_is_available_is_false(): void
    {
        // Nonaktifkan produk nasi goreng meskipun stoknya 15
        $this->cookedFood->update(['is_available' => false]);

        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->cookedFood->id,
                    'quantity' => 1,
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 50000,
            'customer_name' => 'Pembeli Menu Nonaktif',
            'order_source' => 'cashier_direct',
        ]);

        $response->assertSessionHasErrors(['stock']);
        $this->assertDatabaseMissing('orders', [
            'customer_name' => 'Pembeli Menu Nonaktif',
        ]);
    }

    /**
     * Test 19: Validasi backend mewajibkan table_id jika order_source adalah qr_table.
     */
    public function test_checkout_requires_table_id_when_order_source_is_qr_table(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos/checkout', [
            'items' => [
                [
                    'product_id' => $this->instantDrink->id,
                    'quantity' => 1,
                ],
            ],
            'payment_method' => 'tunai',
            'amount_received' => 50000,
            'table_id' => null, // Meja sengaja dikosongkan
            'customer_name' => 'Tamu Tanpa Meja',
            'order_source' => 'qr_table',
        ]);

        $response->assertSessionHasErrors(['table_id']);
    }
}
