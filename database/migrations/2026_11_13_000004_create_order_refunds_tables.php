<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_refunds', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('reason')->nullable();
            $table->foreignUlid('resolved_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['order_id', 'created_at']);
        });

        Schema::create('order_refund_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('order_refund_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('order_item_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('qty');
            $table->timestamps();
            $table->unique(['order_refund_id', 'order_item_id']);
        });

        Schema::table('ledger_entries', function (Blueprint $table) {
            $table->foreignUlid('order_refund_id')->nullable()->constrained()->nullOnDelete();
            $table->unique('order_refund_id');
        });

        Schema::table('ledger_entries', function (Blueprint $table) {
            $table->dropUnique('ledger_entries_order_id_type_unique');
        });

        DB::statement('CREATE UNIQUE INDEX ledger_entries_order_id_type_unique ON ledger_entries (order_id, type) WHERE order_refund_id IS NULL');
    }
};
