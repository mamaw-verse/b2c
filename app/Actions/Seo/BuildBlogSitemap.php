<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Models\BlogPost;
use App\Support\Blog\BlogSeo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * `sitemap-blog.xml`: the blog index, categories and active authors that have a live post, tags
 * that are indexable (3 or more live posts, same rule as the tag page's robots) and every live
 * post. `lastmod` is the newest real `updated_at` behind each URL, never "now". Cached 1 hour
 * under `sitemap:blog`, which `InvalidateBlogCache` clears.
 */
final readonly class BuildBlogSitemap
{
    public function handle(): string
    {
        return Cache::remember('sitemap:blog', 3600, fn (): string => $this->render());
    }

    private function render(): string
    {
        $posts = BlogPost::query()
            ->live()
            ->with(['category:id,slug', 'author:id,slug,is_active,is_house', 'tags:id,slug'])
            ->orderBy('slug')
            ->get(['id', 'slug', 'blog_category_id', 'blog_author_id', 'updated_at']);

        /** @var array<string, Carbon|null> $categories */
        $categories = [];
        $authors = [];
        /** @var array<string, array{count: int, lastmod: Carbon|null}> $tags */
        $tags = [];

        foreach ($posts as $post) {
            $categories[$post->category->slug] = $this->newest($categories[$post->category->slug] ?? null, $post->updated_at);

            if (! $post->author->is_house && $post->author->is_active) {
                $authors[$post->author->slug] = $this->newest($authors[$post->author->slug] ?? null, $post->updated_at);
            }

            foreach ($post->tags as $tag) {
                $tags[$tag->slug] = [
                    'count' => ($tags[$tag->slug]['count'] ?? 0) + 1,
                    'lastmod' => $this->newest($tags[$tag->slug]['lastmod'] ?? null, $post->updated_at),
                ];
            }
        }

        ksort($categories);
        ksort($authors);
        ksort($tags);

        $urls = [];

        if ($posts->isNotEmpty()) {
            $urls[] = [BlogSeo::url(), $posts->max('updated_at')];
        }
        foreach ($categories as $slug => $lastmod) {
            $urls[] = [BlogSeo::url("category/{$slug}"), $lastmod];
        }
        foreach ($authors as $slug => $lastmod) {
            $urls[] = [BlogSeo::url("author/{$slug}"), $lastmod];
        }
        foreach ($tags as $slug => $tag) {
            if ($tag['count'] >= BuildBlogTagSeoData::MIN_POSTS_TO_INDEX) {
                $urls[] = [BlogSeo::url("tag/{$slug}"), $tag['lastmod']];
            }
        }
        foreach ($posts as $post) {
            $urls[] = [BlogSeo::url($post->slug), $post->updated_at];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as [$loc, $lastmod]) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>'."\n";
            if ($lastmod !== null) {
                $xml .= '    <lastmod>'.Carbon::parse($lastmod)->toIso8601String().'</lastmod>'."\n";
            }
            $xml .= "  </url>\n";
        }

        return $xml.'</urlset>';
    }

    private function newest(mixed $current, mixed $candidate): ?Carbon
    {
        $candidate = $candidate === null ? null : Carbon::parse($candidate);
        $current = $current === null ? null : Carbon::parse($current);

        return $current === null || ($candidate !== null && $candidate->gt($current)) ? $candidate : $current;
    }
}
