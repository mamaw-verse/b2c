<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('region_code');
            $table->string('province_code');
            $table->string('city_code');
            $table->string('barangay_code');
            $table->string('street');
            $table->string('postal_code', 4);
            $table->string('landmark')->nullable();
            $table->enum('label', ['home', 'work', 'other'])->default('home');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->foreign('region_code')->references('code')->on('regions');
            $table->foreign('province_code')->references('code')->on('provinces');
            $table->foreign('city_code')->references('code')->on('cities');
            $table->foreign('barangay_code')->references('code')->on('barangays');
        });
    }
};
