<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seller access is a capability of an approved shop, not a role. Any
     * legacy 'seller' role becomes a plain buyer; their shop status decides
     * Seller Centre access from here on.
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'seller')->update(['role' => 'buyer']);
    }
};
