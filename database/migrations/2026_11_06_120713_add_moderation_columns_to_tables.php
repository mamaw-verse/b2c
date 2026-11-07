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
            $table->boolean('suspended')->default(false)->after('auto_reply');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('hidden')->default(false)->after('published');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('hidden')->default(false)->after('seller_replied_at');
        });
    }
};
