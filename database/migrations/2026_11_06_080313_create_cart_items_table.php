<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_variation_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('qty')->default(1);
            $table->boolean('selected')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'product_id', 'product_variation_id']);
        });
    }
};
