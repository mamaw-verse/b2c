<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\Workspace;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * The one definition of "which notifications belong to this workspace".
 * The notification list and the header unread count both go through it so
 * they can never disagree.
 *
 * - Buyer: notifications without a `workspace` key, or tagged `buyer`.
 * - Seller: tagged `seller` AND `shop_id` equal to the active shop, so a
 *   user who works in several shops only sees the current shop's alerts.
 *   With no active shop nothing matches.
 */
final class NotificationScope
{
    /**
     * @template TQuery of Builder|Relation
     *
     * @param  TQuery  $query  a notifications query (`$user->notifications()`, `unreadNotifications()`)
     * @return TQuery
     */
    public static function apply(Builder|Relation $query, Workspace $workspace, ?Shop $activeShop = null): Builder|Relation
    {
        if ($workspace === Workspace::Seller) {
            if ($activeShop === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query
                ->whereRaw("data::jsonb->>'workspace' = ?", [Workspace::Seller->value])
                ->whereRaw("data::jsonb->>'shop_id' = ?", [$activeShop->id]);
        }

        return $query->whereRaw("COALESCE(data::jsonb->>'workspace', 'buyer') = ?", [$workspace->value]);
    }
}
