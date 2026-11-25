<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogCard;
use App\Support\Blog\BlogImageData;
use Illuminate\Support\Facades\Cache;

/**
 * Data for `/blog`: hero, category chips, latest grid (paginated, searchable) and the popular rail.
 * Hero and popular (and the chips, see `ListBlogCategoryChips`) are cached for 5 minutes under plain keys (`InvalidateBlogCache` clears them);
 * the grid is never cached because it depends on `page` and `q`.
 */
final readonly class ListBlogIndex
{
    private const int TTL_SECONDS = 300;

    public function __construct(
        private PaginateLiveBlogPosts $paginate,
        private ListBlogCategoryChips $chips,
    ) {}

    /**
     * @return array{
     *     hero: list<array<string, mixed>>,
     *     popular: list<array<string, mixed>>,
     *     categories: list<array{name: string, slug: string}>,
     *     posts: array{data: list<array<string, mixed>>, meta: array{current_page: int, last_page: int, total: int, per_page: int}},
     *     total_live: int
     * }
     */
    public function handle(int $page = 1, ?string $term = null): array
    {
        $searching = $term !== null && $term !== '';
        // Hero and popular only decorate the first, unfiltered page (plan §4.3).
        $decorate = $page <= 1 && ! $searching;

        $posts = $this->paginate->handle(BlogPost::query()->when($searching, fn ($query) => $query->search((string) $term)));

        return [
            'hero' => $decorate ? $this->hero() : [],
            'popular' => $decorate ? $this->popular() : [],
            'categories' => $this->chips->handle(),
            'posts' => $posts,
            'total_live' => $searching ? BlogPost::query()->live()->count() : $posts['meta']['total'],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function hero(): array
    {
        return Cache::remember('blog:index:hero', self::TTL_SECONDS, function (): array {
            $posts = BlogPost::query()
                ->live()->featured()
                ->select(BlogCard::COLUMNS)
                ->with(BlogCard::RELATIONS)
                ->orderByDesc('published_at')
                ->limit(max(1, config()->integer('blog.hero_count', 5)))
                ->get();

            // The hero shows the cover (large), not the card thumbnail.
            return $posts->map(function (BlogPost $post): array {
                $card = BlogCard::from($post);
                if ($post->coverImage !== null) {
                    $card['image'] = BlogImageData::for($post->coverImage, 'large');
                }

                return $card;
            })->values()->all();
        });
    }

    /** @return list<array<string, mixed>> */
    private function popular(): array
    {
        return Cache::remember('blog:index:popular', self::TTL_SECONDS, fn (): array => BlogCard::many(
            BlogPost::query()
                ->live()
                ->select(BlogCard::COLUMNS)
                ->with(BlogCard::RELATIONS)
                ->orderByDesc('view_count')
                ->orderByDesc('published_at')
                ->limit(max(1, config()->integer('blog.popular_count', 5)))
                ->get()
        ));
    }
}
