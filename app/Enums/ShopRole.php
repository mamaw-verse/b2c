<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The part a user plays in one specific shop. Roles are never stored on
 * the user: they are derived per shop (`shops.user_id` makes an owner, an
 * active `shop_staff` row makes staff), so the same account can be an
 * owner of one shop and staff of several others without the two ever
 * sharing privileges.
 */
enum ShopRole: string
{
    case Owner = 'owner';
    case Staff = 'staff';

    public function isOwner(): bool
    {
        return $this === self::Owner;
    }

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Staff => 'Staff',
        };
    }
}
