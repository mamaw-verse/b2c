<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogImage;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class ListBlogImages
{
    /**
     * The image library: admins see every image, everyone else only their own uploads.
     *
     * @return LengthAwarePaginator<int, BlogImage>
     */
    public function handle(User $viewer, ?string $purpose = null, int $perPage = 24): LengthAwarePaginator
    {
        return BlogImage::query()
            ->when(! $viewer->isAdmin(), fn ($query) => $query->where('uploaded_by_id', $viewer->getKey()))
            ->when($purpose !== null, fn ($query) => $query->where('purpose', $purpose))
            ->withCount('posts')
            ->latest()
            ->paginate($perPage);
    }
}
