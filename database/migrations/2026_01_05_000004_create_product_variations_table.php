<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('product_id')->index()->constrained()->cascadeOnDelete();
            $table->string('option1_value');
            $table->string('option2_value')->nullable();
            $table->unsignedInteger('price')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }
};
