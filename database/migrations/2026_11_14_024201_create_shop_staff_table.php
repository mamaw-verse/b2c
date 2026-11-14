<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_staff', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('shop_id')->index()->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->string('email');
            $table->string('status')->default('pending');
            $table->foreignUlid('invited_by')->constrained('users');
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'email']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX shop_staff_user_id_unique ON shop_staff (user_id) WHERE user_id IS NOT NULL');
        }
    }
};
