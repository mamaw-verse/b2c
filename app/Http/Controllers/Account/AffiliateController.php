<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Account\ActivateAffiliateProfile;
use App\Enums\AffiliateEarningStatus;
use App\Http\Requests\Account\CreateAccountAffiliateRequest;
use App\Http\Requests\Account\ListAccountAffiliateRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class AffiliateController
{
    public function index(ListAccountAffiliateRequest $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $profile = $user->affiliateProfile;

        $defaultBps = (int) config('marketplace.affiliate.default_bps', 500);

        $profileData = null;
        $products = null;

        if ($profile !== null) {
            $totalEarned = (int) $profile->earnings()->where('status', '!=', AffiliateEarningStatus::Cancelled)->sum('amount');
            $pending = (int) $profile->earnings()->where('status', AffiliateEarningStatus::Pending)->sum('amount');
            $available = (int) $profile->earnings()->where('status', AffiliateEarningStatus::Available)->sum('amount');

            $profileData = [
                'id' => $profile->id,
                'code' => $profile->code,
                'status' => $profile->status->value,
                'total_earned' => $totalEarned,
                'pending' => $pending,
                'available' => $available,
            ];

            $products = Product::affiliateEligible()
                ->with(['shop', 'category', 'images'])
                ->latest()
                ->paginate(15)
                ->through(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'shop_name' => $p->shop->name,
                    'category_name' => $p->category->name,
                    'price' => $p->price,
                    'commission_bps' => $p->affiliate_commission_bps ?? $defaultBps,
                    'commission_percent' => ($p->affiliate_commission_bps ?? $defaultBps) / 100,
                    'referral_url' => url("/products/{$p->slug}?ref={$profile->code}"),
                    'image_url' => $p->images->firstWhere('url', '!=', '')?->url,
                    'icon' => $p->images->first()->icon ?? 'package',
                ]);
        }

        return Inertia::render('account/affiliate', [
            'profile' => $profileData,
            'products' => $products,
        ]);
    }

    public function store(
        CreateAccountAffiliateRequest $request,
        ActivateAffiliateProfile $action,
    ): RedirectResponse {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user);

        return redirect()->route('account.affiliate.index');
    }
}
