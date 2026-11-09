<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\ModerationState;
use App\Enums\Workspace;
use App\Models\Category;
use App\Models\Message;
use App\Models\ModerationQueueItem;
use App\Models\Product;
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
        $shop = $user?->shop;
        // Admins have a single unified shell, so their badges and unread
        // counts always reflect the account (buyer) scope even on /admin/*.
        $countScope = $workspace === Workspace::Admin ? Workspace::Buyer : $workspace;
        $allowed = $user === null ? [] : Workspace::allowedFor($user);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'brand' => config('app.brand'),
            'marketplace' => config('marketplace'),
            'auth' => [
                'user' => $request->user(),
            ],
            'workspaces' => fn () => collect($allowed)
                ->map(fn (Workspace $w) => [
                    'key' => $w->value,
                    'label' => $w->label(),
                    'href' => $w->home(),
                    'current' => $w === $workspace || count($allowed) === 1,
                ])->all(),
            'seller' => $shop === null ? null : [
                'status' => $shop->status->value,
                'suspended' => (bool) $shop->suspended,
                'shop_name' => $shop->name,
                'shop_id' => $shop->id,
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
                        $q->whereHas('shop', fn ($sq) => $sq->where('user_id', $request->user()->id));
                    } else {
                        $q->where('user_id', $request->user()->id);
                    }
                })->where(function ($q) use ($request) {
                    $q->where('sender_id', '!=', $request->user()->id)->orWhereNull('sender_id');
                })->whereNull('read_at')->count(),
                'notifications' => $request->user()->unreadNotifications()
                    ->whereRaw("COALESCE(data::jsonb->>'workspace', 'buyer') = ?", [$countScope->value])
                    ->count(),
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
