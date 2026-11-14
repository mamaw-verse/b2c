<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('code', 32)->unique();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignUlid('affiliate_profile_id')->nullable()->constrained('affiliate_profiles')->nullOnDelete();
            $table->unsignedSmallInteger('affiliate_bps')->default(0);
            $table->unsignedBigInteger('affiliate_amount')->default(0);
        });

        Schema::create('affiliate_earnings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('affiliate_profile_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignUlid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUlid('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->bigInteger('amount');
            $table->string('status')->default('pending');
            $table->timestamp('available_at');
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'status']);
            $table->index(['order_id']);
        });
    }
};
