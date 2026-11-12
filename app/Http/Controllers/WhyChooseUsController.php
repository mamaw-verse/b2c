<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WhyChooseUsController
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('why-choose-us', [
            'canBecomeSeller' => $request->user()?->isSeller() === false,
            'halalCertificationUrl' => config('services.halal_certification.url'),
            'b2bUrl' => config('services.b2b.url'),
        ]);
    }
}
