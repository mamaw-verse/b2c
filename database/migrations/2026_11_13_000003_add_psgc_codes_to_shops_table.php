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
            $table->string('region_code')->nullable()->after('postal_code');
            $table->string('province_code')->nullable()->after('region_code');
            $table->string('city_code')->nullable()->after('province_code');
            $table->string('barangay_code')->nullable()->after('city_code');
        });
    }
};
