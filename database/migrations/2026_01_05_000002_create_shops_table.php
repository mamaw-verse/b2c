<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('location');
            $table->decimal('rating', 2, 1)->default(0);
            $table->unsignedInteger('followers_count')->default(0);
            $table->unsignedTinyInteger('chat_response_rate')->nullable();
            $table->string('verification')->nullable();
            $table->boolean('halal_only')->default(false);
            $table->timestamps();
        });
    }
};
