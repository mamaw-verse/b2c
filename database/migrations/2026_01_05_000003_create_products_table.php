<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->index()->constrained()->cascadeOnDelete();
            $table->foreignUlid('category_id')->index()->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->unsignedInteger('was_price')->nullable();
            $table->decimal('rating', 2, 1)->default(0);
            $table->unsignedInteger('sold_count')->default(0);
            $table->string('location');
            $table->boolean('free_shipping')->default(false);
            $table->boolean('frozen')->default(false);
            $table->string('halal_status')->default('na')->index();
            $table->unsignedInteger('stock')->default(0);
            $table->string('option1_name')->nullable();
            $table->string('option2_name')->nullable();
            $table->boolean('published')->default(true)->index();
            $table->timestamps();
        });
    }
};
