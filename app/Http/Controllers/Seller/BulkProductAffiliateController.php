<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\BulkUpdateProductAffiliate;
use App\Http\Requests\Seller\CreateBulkProductAffiliateRequest;
use Illuminate\Http\RedirectResponse;

final class BulkProductAffiliateController
{
    public function store(
        CreateBulkProductAffiliateRequest $request,
        BulkUpdateProductAffiliate $action,
    ): RedirectResponse {
        $shop = $request->user()?->shop;
        assert($shop !== null);

        $action->handle(
            $shop,
            $request->productIds(),
            $request->enabled(),
        );

        return back();
    }
}
