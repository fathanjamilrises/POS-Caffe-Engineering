<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique()->comment('Nomor Struk Transaksi');
            $table->string('token_number', 20)->comment('Nomor Token Antrean untuk KDS & Pemanggilan');
            $table->foreignId('shift_id')->nullable()->constrained('cashier_shifts')->nullOnDelete()->comment('Untuk Rekap Shift Kasir');
            $table->foreignId('table_id')->nullable()->constrained('dining_tables')->nullOnDelete()->comment('Terisi jika dari Scan QR Meja');
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name', 100)->nullable();
            $table->string('order_source', 20)->comment('qr_table, cashier_direct');
            $table->string('order_status', 20)->default('pending')->comment('pending, confirmed, processing, ready, served');
            $table->string('payment_method', 20)->comment('tunai, qris');
            $table->string('payment_status', 20)->default('unpaid')->comment('unpaid, paid, refunded');
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0)->comment('Total Belanja');
            $table->decimal('amount_received', 12, 2)->default(0)->comment('Uang Diterima, wajib >= total_amount');
            $table->decimal('change_amount', 12, 2)->default(0)->comment('Hitung Kembalian = amount_received - total_amount');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
