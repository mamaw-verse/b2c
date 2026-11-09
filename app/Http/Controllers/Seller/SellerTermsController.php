<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use Inertia\Inertia;
use Inertia\Response;

final class SellerTermsController
{
    public function __invoke(): Response
    {
        return Inertia::render('seller/terms', [
            'sellerTerms' => config('marketplace.seller_terms'),
        ]);
    }
}
