<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('moderation_queue_item_id');
            $table->foreign('moderation_queue_item_id')->references('id')->on('moderation_queue_items')->cascadeOnDelete();
            $table->ulid('admin_id')->nullable(); // null = automated system action
            $table->foreign('admin_id')->references('id')->on('users')->nullOnDelete();
            $table->string('action'); // approved|rejected|hidden|suspended|flagged|auto_flagged
            $table->string('reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['moderation_queue_item_id', 'created_at']);
        });
    }
};
