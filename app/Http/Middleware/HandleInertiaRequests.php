<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\MessageSenderRole;
use App\Enums\ModerationState;
use App\Enums\Workspace;
use App\Models\Category;
use App\Models\Message;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Support\NotificationScope;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return app()->environment('testing') ? null : parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $workspace = Workspace::fromRequest($request);
        $shop = $user?->operatedShop();
        // Admins have a single unified shell, so their badges and unread
        // counts always reflect the account (buyer) scope even on /admin/*.
        $countScope = $workspace === Workspace::Admin ? Workspace::Buyer : $workspace;
        $allowed = $user === null ? [] : Workspace::allowedFor($user);
        $unreadByShop = $shop === null
            ? []
            : NotificationScope::unreadSellerCountsByShop($user, $user->operatedShops()->pluck('shop.id')->all());

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'brand' => config('app.brand'),
            'seo' => fn () => app(\App\Support\Seo::class)->resolve()->toArray(),
            'marketplace' => fn () => app(Settings::class)->marketplaceConfig(),
            'auth' => [
                'user' => $request->user(),
                'has_password' => $request->user()?->hasPassword(),
                'has_google' => $request->user()?->hasGoogleIdentity(),
            ],
            // Cloudflare Turnstile site key; null disables the widget.
            'turnstileSiteKey' => config('humancheck.enabled')
                ? config('services.turnstile.key')
                : null,
            'workspaces' => fn () => collect($allowed)
                ->map(fn (Workspace $w) => [
                    'key' => $w->value,
                    'label' => $w->label(),
                    'href' => $w->home($user),
                    'current' => $w === $workspace || count($allowed) === 1,
                ])->all(),
            'seller' => $shop === null ? null : [
                'role' => $user->activeShopRole()?->value ?? 'staff',
                'status' => $shop->status->value,
                'suspended' => (bool) $shop->suspended,
                'shop_name' => $shop->name,
                'shop_id' => $shop->id,
                'shop_slug' => $shop->slug,
                // The user's own shop (the one they own, not the operated shop).
                // null when the user does not own any shop. Used to decide
                // whether to show the "Register my own shop" link for staff.
                'own_shop' => $user->shop === null ? null : ['status' => $user->shop->status->value],
                // Every shop the user operates, for the shop switcher.
                // `role` is per shop: owned shops are 'owner', managed ones 'staff'.
                'shops' => $user->operatedShops()
                    ->map(fn (array $m) => [
                        'id' => $m['shop']->id,
                        'name' => $m['shop']->name,
                        'slug' => $m['shop']->slug,
                        'logo_url' => $m['shop']->logo_url,
                        'role' => $m['role']->value,
                        'suspended' => (bool) $m['shop']->suspended,
                        'active' => $m['shop']->id === $shop->id,
                        'unread_notifications' => $unreadByShop[$m['shop']->id] ?? 0,
                    ])
                    ->values()
                    ->all(),
            ],
            // Pending + flagged moderation items, shared on every page so the
            // admin sidebar badge stays visible outside the admin pages too.
            'pendingQueueCount' => fn () => $user?->isAdmin() ? ModerationQueueItem::whereIn('state', [
                ModerationState::Pending->value,
                ModerationState::Flagged->value,
            ])->count() : 0,
            'unreadCounts' => fn () => $request->user() ? [
                'chat' => Message::whereHas('conversation', function ($q) use ($request, $countScope) {
                    if ($countScope === Workspace::Seller) {
                        $operated = $request->user()->operatedShop();
                        if ($operated !== null) {
                            $q->where('shop_id', $operated->id);
                        } else {
                            $q->whereRaw('1 = 0');
                        }
                    } else {
                        $q->where('user_id', $request->user()->id);
                    }
                })->where(function ($q) use ($request, $countScope) {
                    if ($countScope === Workspace::Seller) {
                        $q->where('sender_role', MessageSenderRole::Buyer->value);
                    } else {
                        $q->where('sender_id', '!=', $request->user()->id)->orWhereNull('sender_id');
                    }
                })->whereNull('read_at')->count(),
                'notifications' => NotificationScope::apply(
                    $request->user()->unreadNotifications(),
                    $countScope,
                    $request->user()->operatedShop(),
                )->count(),
            ] : null,
            'cartCount' => fn () => $request->user()?->cartItems()->count() ?? 0,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'navCategories' => Category::whereNull('parent_id')->orderBy('sort_order')->limit(8)->get(['id', 'name', 'slug']),
            'searchSuggestions' => fn () => cache()->remember('search_suggestions', 3600, function () {
                $categories = Category::whereNull('parent_id')->orderBy('sort_order')->limit(5)->pluck('name');
                $products = Product::visible()->orderByDesc('sold_count')->limit(5)->pluck('name');

                return $categories->merge($products)->unique()->take(8)->values()->all();
            }),
        ];
    }
}
