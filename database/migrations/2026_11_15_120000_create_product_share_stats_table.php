<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_share_stats', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('product_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 20);
            $table->date('shared_on');
            $table->unsignedInteger('count')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'channel', 'shared_on']);
            $table->index(['product_id', 'shared_on']);
        });
    }
};
