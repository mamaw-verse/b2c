<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('order_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('product_variation_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('variation_label')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('qty');
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });
    }
};
