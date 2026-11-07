<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('province_code');
            $table->boolean('is_municipality')->default(false);
            $table->foreign('province_code')->references('code')->on('provinces');
            $table->timestamps();
        });
    }
};
