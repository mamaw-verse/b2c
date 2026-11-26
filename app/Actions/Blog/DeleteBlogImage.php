<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogImage;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final readonly class DeleteBlogImage
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @throws ValidationException when a post, cover, thumbnail or author avatar still uses the image
     */
    public function handle(BlogImage $image, User $actor, ?string $ip = null): void
    {
        if ($image->isReferenced()) {
            throw ValidationException::withMessages(['image' => 'This image is in use and cannot be deleted.']);
        }

        $this->audit->handle($actor, 'blog.image.deleted', $image, [
            'purpose' => $image->purpose,
            'uploaded_by_id' => $image->uploaded_by_id,
        ], $ip);

        Storage::disk($image->disk)->delete($image->storedPaths());
        $image->delete();
    }
}
