<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Product;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListHomeFeed
{
    /** @return CursorPaginator<int, array<string, mixed>> */
    public function handle(): CursorPaginator
    {
        $paginator = Product::visible()
            ->with(['halalCertification', 'images'])
            ->latest()
            ->cursorPaginate(24);

        $paginator->setCollection($paginator->collect()->map(fn (Product $p): array => $p->toCard()));

        return $paginator;
    }
}
