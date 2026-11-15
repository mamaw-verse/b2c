<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\SearchProducts;
use App\Actions\Seo\BuildSearchSeoData;
use App\Http\Requests\ListSearchResultsRequest;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class SearchController
{
    /**
     * Show product search results.
     */
    public function index(
        ListSearchResultsRequest $request,
        SearchProducts $search,
        BuildSearchSeoData $buildSeoData,
        Seo $seo
    ): Response {
        $filters = $request->filters();
        $queryText = (string) ($filters['q'] ?? '');

        $seoData = $buildSeoData->handle($queryText, $request);
        $seo->set($seoData);

        return Inertia::render('search', [
            'query' => $queryText,
            'filters' => $filters,
            'products' => Inertia::scroll(fn () => $search->handle($filters)),
        ])->withViewData(['seo' => $seoData]);
    }
}
