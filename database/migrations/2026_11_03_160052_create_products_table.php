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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('barcode', 100)->nullable()->unique()->comment('Scan barcode di Admin & Kasir');
            $table->string('product_name', 150);
            $table->decimal('cost_price', 12, 2)->comment('Harga modal untuk Laba Rugi');
            $table->decimal('selling_price', 12, 2)->comment('Kelola Harga oleh Admin');
            $table->integer('stock_qty')->default(0)->comment('Kelola Stok Dasar');
            $table->boolean('requires_kitchen')->default(false)->comment('true = kirim tiket ke KDS, false = instan');
            $table->boolean('is_available')->default(true)->comment('false jika stok 0 / habis, terkunci di menu');
            $table->softDeletes()->comment('Soft delete saat Admin hapus menu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
