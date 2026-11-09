<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ShowContentPageRequest;
use Inertia\Inertia;
use Inertia\Response;

final class ContentPageController
{
    public function show(ShowContentPageRequest $request): Response
    {
        return Inertia::render('content', ['page' => $request->page()]);
    }
}
