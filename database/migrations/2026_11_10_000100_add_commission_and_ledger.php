<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedSmallInteger('commission_bps')->nullable();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedSmallInteger('commission_bps')->default(0);
            $table->unsignedBigInteger('commission_amount')->default(0);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->ulid('payout_id')->nullable()->index();
            $table->string('type');
            $table->bigInteger('amount');
            $table->timestamp('available_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['order_id', 'type']);
            $table->index(['shop_id', 'available_at']);
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->string('payout_method')->nullable();
            $table->string('payout_account_name')->nullable();
            $table->text('payout_account_number')->nullable();
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('status')->default('requested');
            $table->string('method');
            $table->string('account_name');
            $table->text('account_number');
            $table->string('reference')->nullable();
            $table->foreignUlid('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['shop_id', 'status']);
        });
    }
};
