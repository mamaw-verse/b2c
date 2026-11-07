<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\SearchProducts;
use App\Http\Requests\ListSearchResultsRequest;
use Inertia\Inertia;
use Inertia\Response;

final class SearchController
{
    /**
     * Show product search results.
     */
    public function index(ListSearchResultsRequest $request, SearchProducts $search): Response
    {
        $filters = $request->filters();

        return Inertia::render('search', [
            'query' => $filters['q'] ?? '',
            'filters' => $filters,
            'products' => Inertia::scroll(fn () => $search->handle($filters)),
        ]);
    }
}
