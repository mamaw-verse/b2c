<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seller notifications now carry the shop they concern. Tag the
     * existing ones from their order so per-shop lists and counts include
     * them. Rows whose order no longer exists stay untagged and drop out
     * of seller lists (their links would 404 anyway).
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
            UPDATE notifications
            SET data = (notifications.data::jsonb || jsonb_build_object('shop_id', orders.shop_id))::text
            FROM orders
            WHERE notifications.data::jsonb->>'workspace' = 'seller'
              AND notifications.data::jsonb->>'shop_id' IS NULL
              AND orders.id::text = notifications.data::jsonb->>'order_id'
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
            UPDATE notifications
            SET data = (notifications.data::jsonb - 'shop_id')::text
            WHERE notifications.data::jsonb->>'workspace' = 'seller'
        SQL);
    }
};
