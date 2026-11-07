<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('address_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('shipping_option_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->foreignUlid('platform_voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->enum('payment_method', ['cod', 'ewallet', 'card', 'banking']);
            $table->enum('status', ['pending', 'to_pay', 'to_ship', 'to_receive', 'completed', 'cancelled', 'return_refund'])->default('pending');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('shipping_fee', 10, 2);
            $table->decimal('shipping_discount', 10, 2)->default(0);
            $table->decimal('voucher_discount', 10, 2)->default(0);
            $table->decimal('platform_voucher_discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->decimal('cod_fee', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
