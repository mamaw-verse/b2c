<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('terms_version')->nullable()->after('agreed_to_terms');
            $table->timestamp('terms_accepted_at')->nullable()->after('terms_version');
        });
    }
};
