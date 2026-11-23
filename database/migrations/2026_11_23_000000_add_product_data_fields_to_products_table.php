<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand', 100)->nullable()->after('name');
            $table->string('gtin', 50)->nullable()->after('brand');
            $table->text('allergens')->nullable()->after('ingredients');
            $table->string('storage_condition', 100)->nullable()->after('frozen');
            $table->string('country_of_origin', 50)->nullable()->after('location');
        });
    }
};
