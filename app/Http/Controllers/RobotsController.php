<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildRobotsTxt;
use Illuminate\Http\Response;

final class RobotsController
{
    public function __invoke(BuildRobotsTxt $robots): Response
    {
        return response($robots->handle(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
