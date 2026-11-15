<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildContentPageSeoData;
use App\Http\Requests\ShowContentPageRequest;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class ContentPageController
{
    public function show(
        ShowContentPageRequest $request,
        BuildContentPageSeoData $buildSeoData,
        Seo $seo
    ): Response {
        $pageKey = (string) $request->route('page');
        $pageData = $request->page();

        $seoData = $buildSeoData->handle($pageKey, $pageData);
        $seo->set($seoData);

        return Inertia::render('content', ['page' => $pageData])
            ->withViewData(['seo' => $seoData]);
    }
}
