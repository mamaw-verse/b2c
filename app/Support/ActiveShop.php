<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\ShopRole;
use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Resolves which shop a seller-workspace request acts on.
 *
 * A user may own one shop and be active staff at several others. The
 * choice is held in the session, but it is only ever a *hint*: every
 * request re-validates it against the live membership rows, so a user
 * who is removed from (or never belonged to) the stored shop silently
 * falls back to a shop they really operate. Nothing here trusts client
 * input beyond the id handed to `switchTo()`, which is checked too.
 */
final class ActiveShop
{
    public const SESSION_KEY = 'seller.active_shop_id';

    /**
     * Approved shops the user operates, owned first, then managed shops
     * in the order they joined. Each carries its derived role.
     *
     * @return Collection<int, array{shop: Shop, role: ShopRole}>
     */
    public function memberships(User $user): Collection
    {
        $request = $this->memoRequest();
        $key = 'active_shop.memberships.'.$user->id;

        if ($request?->attributes->has($key)) {
            /** @var Collection<int, array{shop: Shop, role: ShopRole}> */
            return $request->attributes->get($key);
        }

        $memberships = collect();

        $owned = Shop::query()->where('user_id', $user->id)->get()->filter->isApproved();
        foreach ($owned as $shop) {
            $memberships->push(['shop' => $shop, 'role' => ShopRole::Owner]);
        }

        $managed = Shop::query()
            ->select('shops.*')
            ->join('shop_staff', 'shop_staff.shop_id', '=', 'shops.id')
            ->where('shop_staff.user_id', $user->id)
            ->where('shop_staff.status', ShopStaffStatus::Active->value)
            ->where(fn ($q) => $q->whereNull('shops.user_id')->orWhere('shops.user_id', '!=', $user->id))
            ->orderBy('shop_staff.accepted_at')
            ->orderBy('shop_staff.created_at')
            ->get()
            ->filter->isApproved();

        foreach ($managed as $shop) {
            $memberships->push(['shop' => $shop, 'role' => ShopRole::Staff]);
        }

        $memberships = $memberships->unique(fn (array $m) => $m['shop']->id)->values();
        $request?->attributes->set($key, $memberships);

        return $memberships;
    }

    /**
     * Drop what was resolved earlier in this request. Call after changing
     * the user's memberships (leaving or being removed from a shop) so the
     * next lookup reads the database again.
     */
    public function refresh(User $user): void
    {
        $attributes = $this->memoRequest()?->attributes;
        $attributes?->remove('active_shop.memberships.'.$user->id);
        $attributes?->remove('active_shop.resolved.'.$user->id);
    }

    /** The shop this request acts on, or null when the user operates none. */
    public function shop(User $user): ?Shop
    {
        return $this->resolve($user)['shop'] ?? null;
    }

    /** The user's role in the active shop. */
    public function role(User $user): ?ShopRole
    {
        return $this->resolve($user)['role'] ?? null;
    }

    public function roleIn(User $user, Shop $shop): ?ShopRole
    {
        return $this->memberships($user)->first(fn (array $m) => $m['shop']->id === $shop->id)['role'] ?? null;
    }

    /**
     * Make `$shopId` the active shop. Returns null (and changes nothing)
     * when the user does not currently operate that shop.
     */
    public function switchTo(User $user, string $shopId): ?Shop
    {
        $match = $this->memberships($user)->first(fn (array $m) => $m['shop']->id === $shopId);

        if ($match === null) {
            return null;
        }

        $this->remember($shopId);
        $this->memoRequest()?->attributes->remove('active_shop.resolved.'.$user->id);

        return $match['shop'];
    }

    /**
     * @return array{shop: Shop, role: ShopRole}|null
     */
    private function resolve(User $user): ?array
    {
        $request = $this->memoRequest();
        $key = 'active_shop.resolved.'.$user->id;

        if ($request?->attributes->has($key)) {
            /** @var array{shop: Shop, role: ShopRole}|null */
            return $request->attributes->get($key);
        }

        $memberships = $this->memberships($user);
        $stored = $this->stored();

        $resolved = $stored === null
            ? null
            : $memberships->first(fn (array $m) => $m['shop']->id === $stored);

        if ($resolved === null) {
            // Nothing stored, or the stored shop is no longer operated by
            // this user: prefer a shop that is not suspended, owned first.
            $resolved = $memberships->first(fn (array $m) => ! $m['shop']->suspended)
                ?? $memberships->first();

            if ($stored !== null && $request?->isMethod('GET') && $request->hasSession()) {
                $request->session()->flash('error', 'You no longer have access to that shop. Switched to another shop you manage.');
            }

            $resolved === null ? $this->forget() : $this->remember($resolved['shop']->id);
        }

        $request?->attributes->set($key, $resolved);

        return $resolved;
    }

    private function stored(): ?string
    {
        $request = $this->request();

        if ($request === null || ! $request->hasSession()) {
            return null;
        }

        $value = $request->session()->get(self::SESSION_KEY);

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function remember(string $shopId): void
    {
        $request = $this->request();

        if ($request?->hasSession()) {
            $request->session()->put(self::SESSION_KEY, $shopId);
        }
    }

    private function forget(): void
    {
        $request = $this->request();

        if ($request?->hasSession()) {
            $request->session()->forget(self::SESSION_KEY);
        }
    }

    /** The request to memoise on: only a real web request (one with a session). */
    private function memoRequest(): ?Request
    {
        $request = $this->request();

        return $request?->hasSession() ? $request : null;
    }

    private function request(): ?Request
    {
        return app()->bound('request') ? app('request') : null;
    }
}
