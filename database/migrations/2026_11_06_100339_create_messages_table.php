<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_role')->default('buyer'); // buyer, seller, system
            $table->string('type')->default('text'); // text, product, order, system
            $table->text('body')->nullable();
            $table->foreignUlid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUlid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }
};
