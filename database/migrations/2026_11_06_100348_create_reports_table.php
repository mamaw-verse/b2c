<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->ulidMorphs('reportable');
            $table->string('reason');
            $table->text('details')->nullable();
            $table->string('status')->default('pending'); // pending, reviewed, dismissed, actioned
            $table->timestamps();
        });
    }
};
