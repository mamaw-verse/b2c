<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final readonly class DeleteBlogImage
{
    /**
     * @throws ValidationException when a post, cover, thumbnail or author avatar still uses the image
     */
    public function handle(BlogImage $image): void
    {
        if ($image->isReferenced()) {
            throw ValidationException::withMessages(['image' => 'This image is in use and cannot be deleted.']);
        }

        Storage::disk($image->disk)->delete($image->storedPaths());
        $image->delete();
    }
}
