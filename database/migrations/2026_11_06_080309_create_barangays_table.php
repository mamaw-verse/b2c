<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('city_code');
            $table->foreign('city_code')->references('code')->on('cities');
            $table->timestamps();
        });
    }
};
