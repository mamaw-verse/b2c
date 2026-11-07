<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('region_code');
            $table->foreign('region_code')->references('code')->on('regions');
            $table->timestamps();
        });
    }
};
