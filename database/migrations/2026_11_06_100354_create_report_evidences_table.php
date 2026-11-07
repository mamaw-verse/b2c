<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_evidences', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });
    }
};
