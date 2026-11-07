<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Category;
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
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'brand' => config('app.brand'),
            'auth' => [
                'user' => $request->user(),
            ],
            'unreadCounts' => fn () => $request->user() ? [
                'chat' => \App\Models\Message::whereHas('conversation', function ($q) use ($request) {
                    $q->where('user_id', $request->user()->id)
                        ->orWhereHas('shop', fn ($sq) => $sq->where('user_id', $request->user()->id));
                })->where(function ($q) use ($request) {
                    $q->where('sender_id', '!=', $request->user()->id)->orWhereNull('sender_id');
                })->whereNull('read_at')->count(),
                'notifications' => $request->user()->unreadNotifications()->count(),
            ] : null,
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
