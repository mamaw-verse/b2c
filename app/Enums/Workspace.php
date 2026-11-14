<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\User;
use Illuminate\Http\Request;

enum Workspace: string
{
    case Buyer = 'buyer';
    case Seller = 'seller';
    case Admin = 'admin';

    /**
     * The workspaces surfaced to a user, in display order. Admins get a
     * single unified shell — they are not offered buyer or seller links
     * even when those areas remain reachable by URL.
     *
     * @return array<int, self>
     */
    public static function allowedFor(?User $user): array
    {
        if ($user?->isAdmin()) {
            return [self::Admin];
        }

        return array_values(array_filter(
            self::cases(),
            fn (self $workspace) => $workspace->accessibleBy($user),
        ));
    }

    /**
     * Resolve the current workspace from the request URL. The URL is the
     * source of truth; anything outside the three prefixes is the
     * storefront, which belongs to the buyer context.
     */
    public static function fromRequest(Request $request): self
    {
        return match (true) {
            $request->is('seller', 'seller/*') => self::Seller,
            $request->is('admin', 'admin/*') => self::Admin,
            default => self::Buyer,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Buyer => 'Buyer account',
            self::Seller => 'Seller Centre',
            self::Admin => 'Admin',
        };
    }

    public function prefix(): string
    {
        return match ($this) {
            self::Buyer => '/account',
            self::Seller => '/seller',
            self::Admin => '/admin',
        };
    }

    public function home(): string
    {
        return match ($this) {
            self::Buyer => '/account',
            self::Seller => '/seller/dashboard',
            self::Admin => '/admin/dashboard',
        };
    }

    /**
     * Whether the user may enter this workspace right now.
     */
    public function accessibleBy(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return match ($this) {
            self::Buyer => ! $user->isAdmin(),
            self::Seller => ! $user->isAdmin() && ($shop = $user->operatedShop()) !== null && $shop->isApproved(),
            self::Admin => $user->isAdmin(),
        };
    }
}
