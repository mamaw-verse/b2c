<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_options', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->decimal('fee', 10, 2)->default(0);
            $table->boolean('is_cold_chain')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('eta_days_min')->nullable();
            $table->integer('eta_days_max')->nullable();
            $table->timestamps();
        });
    }
};
