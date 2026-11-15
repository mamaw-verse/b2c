<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\GenerateSocialImage;
use App\Http\Requests\ShowSocialImageRequest;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class SocialImageController
{
    public function __invoke(ShowSocialImageRequest $request, GenerateSocialImage $generator): BinaryFileResponse
    {
        $path = $generator->handle($request->type(), $request->slug(), $request->version());

        return response()->file($path, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
