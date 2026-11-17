<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * `shop_staff` is already the membership table (one row per shop and
     * person, with a per-shop status). The only thing keeping a user to a
     * single shop was this partial unique index on `user_id`; replace it
     * with one that only forbids joining the *same* shop twice.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS shop_staff_user_id_unique');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS shop_staff_shop_id_user_id_unique ON shop_staff (shop_id, user_id) WHERE user_id IS NOT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS shop_staff_shop_id_user_id_unique');
            // Re-creating the single-shop rule fails if a user already
            // staffs several shops; remove the extra memberships first.
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS shop_staff_user_id_unique ON shop_staff (user_id) WHERE user_id IS NOT NULL');
        }
    }
};
