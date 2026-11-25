<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogAuthor;
use App\Models\BlogPost;
use App\Support\Blog\BlogImageData;

final readonly class ShowBlogAuthor
{
    public function __construct(private PaginateLiveBlogPosts $paginate) {}

    /**
     * @return array{author: array<string, mixed>, posts: array{data: list<array<string, mixed>>, meta: array<string, int>}}
     */
    public function handle(BlogAuthor $author): array
    {
        $author->loadMissing('avatar');

        return [
            'author' => self::present($author),
            'posts' => $this->paginate->handle(BlogPost::query()->byAuthor($author)),
        ];
    }

    /**
     * Public author fields. Links are re-filtered to https even though they are validated on save.
     *
     * @return array{name: string, slug: string, job_title: string|null, bio: string|null, avatar: array{src: string, width: int, height: int}|null, links: list<array{label: string, url: string}>}
     */
    public static function present(BlogAuthor $author): array
    {
        $links = [];
        foreach ((array) $author->links as $link) {
            $url = (string) ($link['url'] ?? '');
            if (str_starts_with(mb_strtolower($url), 'https://')) {
                $links[] = ['label' => (string) ($link['label'] ?? $url), 'url' => $url];
            }
        }

        return [
            'name' => $author->display_name,
            'slug' => $author->slug,
            'job_title' => $author->job_title,
            'bio' => $author->bio,
            'avatar' => $author->avatar === null ? null : BlogImageData::avatar($author->avatar),
            'links' => array_slice($links, 0, 4),
        ];
    }
}
