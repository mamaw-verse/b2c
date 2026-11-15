<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\RecordProductShare;
use App\Http\Requests\CreateProductShareRequest;
use App\Models\Product;
use Illuminate\Http\Response;
use Throwable;

final class ProductShareController
{
    public function store(CreateProductShareRequest $request, Product $product, RecordProductShare $action): Response
    {
        try {
            $action->handle($product, $request->channel(), $request->fingerprint());
        } catch (Throwable $e) {
            report($e);
        }

        return response()->noContent();
    }
}
