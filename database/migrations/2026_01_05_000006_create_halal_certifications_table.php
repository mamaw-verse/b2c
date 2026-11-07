<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halal_certifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulidMorphs('certifiable');
            $table->string('certifying_body');
            $table->string('number');
            $table->string('scope')->nullable();
            $table->date('valid_until');
            $table->timestamp('checked_at')->nullable();
            $table->string('document_path')->nullable();
            $table->timestamps();
        });
    }
};
