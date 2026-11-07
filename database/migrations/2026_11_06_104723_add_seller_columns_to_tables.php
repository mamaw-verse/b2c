<?php

declare(strict_types=1);

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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('buyer')->index();
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->boolean('vacation_mode')->default(false);
            $table->boolean('auto_reply')->default(true);
            $table->json('shipping_channels')->nullable();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->text('ingredients')->nullable();
            $table->boolean('no_pork_alcohol_declared')->default(false);
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
        });

        Schema::table('product_variations', function (Blueprint $table) {
            $table->string('sku')->nullable();
        });
    }
};
