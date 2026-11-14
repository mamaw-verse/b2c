<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->string('original_filename');
            $table->string('extension', 10);
            $table->string('storage_path');
            $table->string('mime_type');
            $table->string('description')->nullable();
            $table->string('scan_status')->default('clean');
            $table->foreignUlid('uploaded_by_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('scan_status');
            $table->index('mime_type');
        });
    }
};
