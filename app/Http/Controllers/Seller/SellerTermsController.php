<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seo\BuildSellerTermsSeoData;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class SellerTermsController
{
    public function __invoke(BuildSellerTermsSeoData $buildSeoData, Seo $seo): Response
    {
        $seoData = $buildSeoData->handle();
        $seo->set($seoData);

        return Inertia::render('seller/terms', [
            'sellerTerms' => config('marketplace.seller_terms'),
        ])->withViewData(['seo' => $seoData]);
    }
}
