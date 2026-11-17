<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ShowMediaViewRequest;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class MediaViewController
{
    public function __invoke(ShowMediaViewRequest $request, Media $media): RedirectResponse|StreamedResponse
    {
        if (str_starts_with($media->mime_type, 'video/')) {
            $url = Storage::disk(config('filesystems.media_disk'))->temporaryUrl($media->storage_path, now()->addMinutes(30), [
                'ResponseContentType' => $media->mime_type,
            ]);

            return redirect()->away($url)->header('Cache-Control', 'private, max-age=300');
        }

        $response = Storage::disk(config('filesystems.media_disk'))->response(
            $media->storage_path,
            $media->original_filename
        );

        $response->headers->set(
            'Cache-Control',
            $request->isPublic() ? 'public, max-age=31536000, immutable' : 'private, max-age=3600'
        );

        return $response;
    }
}
