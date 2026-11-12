<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\ListHomeFeed;
use App\Actions\Voucher\ListActiveVouchers;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class HomeController
{
    /**
     * Show the storefront home page.
     */
    public function __invoke(Request $request, ListHomeFeed $feed, ListActiveVouchers $vouchers): Response
    {
        return Inertia::render('home', [
            'categories' => Category::whereNull('parent_id')
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon']),
            'products' => Inertia::scroll(fn () => $feed->handle()),
            'vouchers' => $vouchers->handle(3),
            'canBecomeSeller' => $request->user()?->isSeller() === false,
            'halalCertificationUrl' => config('services.halal_certification.url'),
            'b2bUrl' => config('services.b2b.url'),
        ]);
    }
}
