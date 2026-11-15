<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildWhyChooseUsSeoData;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WhyChooseUsController
{
    public function __invoke(Request $request, BuildWhyChooseUsSeoData $buildSeoData, Seo $seo): Response
    {
        $seoData = $buildSeoData->handle();
        $seo->set($seoData);

        return Inertia::render('why-choose-us', [
            'canBecomeSeller' => $request->user()?->isSeller() !== true,
            'halalCertificationUrl' => config('services.halal_certification.url'),
            'b2bUrl' => config('services.b2b.url'),
        ])->withViewData(['seo' => $seoData]);
    }
}
