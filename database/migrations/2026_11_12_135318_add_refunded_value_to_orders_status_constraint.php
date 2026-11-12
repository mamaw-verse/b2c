<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Drop and recreate the orders_status_check constraint to include 'refunded'.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
        DB::statement("
            ALTER TABLE orders ADD CONSTRAINT orders_status_check
            CHECK (status::text = ANY (ARRAY[
                'pending', 'to_pay', 'to_ship', 'to_receive',
                'completed', 'cancelled', 'return_refund', 'refunded'
            ]::text[]))
        ");
    }
};
