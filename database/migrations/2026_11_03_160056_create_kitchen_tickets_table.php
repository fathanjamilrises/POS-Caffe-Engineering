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
        Schema::create('kitchen_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('order_item_id')->unique()->constrained('order_items')->cascadeOnDelete();
            $table->string('token_number', 20);
            $table->foreignId('chef_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ticket_status', 30)->default('waiting')->comment('waiting, cooking, delivered_to_cashier, completed');
            $table->boolean('is_audio_notified')->default(false)->comment('Trigger notifikasi suara di dapur');
            $table->timestamp('sent_to_kds_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kitchen_tickets');
    }
};
