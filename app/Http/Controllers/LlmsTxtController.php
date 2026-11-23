<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildLlmsTxt;
use Illuminate\Http\Response;

final class LlmsTxtController
{
    public function __invoke(BuildLlmsTxt $llms): Response
    {
        abort_unless($llms->isAvailable(), 404);

        return response($llms->handle(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
