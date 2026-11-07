<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique();
            $table->enum('kind', ['shop', 'platform', 'shipping']);
            $table->enum('discount_type', ['fixed', 'percent']);
            $table->decimal('discount_value', 10, 2);
            $table->decimal('max_discount', 10, 2)->nullable();
            $table->decimal('min_spend', 10, 2)->default(0);
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
