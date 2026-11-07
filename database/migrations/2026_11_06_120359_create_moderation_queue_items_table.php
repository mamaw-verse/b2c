<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_queue_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulidMorphs('target');
            $table->string('type')->default('general'); // general|halal|report|keyword|expiry
            $table->string('state')->default('pending'); // pending|flagged|hidden|suspended|resolved
            $table->string('reason_code')->nullable();
            $table->nullableUlidMorphs('flagged_by');
            $table->ulid('resolved_by')->nullable();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('decision_reason')->nullable();
            $table->timestamps();

            $table->index(['state', 'type', 'created_at']);
        });
    }
};
