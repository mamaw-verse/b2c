<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('product_id')->index()->constrained()->cascadeOnDelete();
            $table->string('url')->nullable();
            $table->string('icon')->default('package');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }
};
