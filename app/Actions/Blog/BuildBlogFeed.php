<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogSeo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * `/blog/feed.xml`: RSS 2.0 with the 20 newest live posts (docs/planning/15-blog.md B4.1).
 * Cached under `blog:feed`, which `InvalidateBlogCache` clears. Only excerpts are published,
 * never the body, so the feed cannot replace a visit to the article.
 */
final readonly class BuildBlogFeed
{
    public const string CACHE_KEY = 'blog:feed';

    private const int TTL_SECONDS = 600;

    private const int LIMIT = 20;

    public function handle(): string
    {
        return Cache::remember(self::CACHE_KEY, self::TTL_SECONDS, fn (): string => $this->render());
    }

    public static function url(): string
    {
        return BlogSeo::url('feed.xml');
    }

    private function render(): string
    {
        $posts = BlogPost::query()
            ->live()
            ->select(['id', 'blog_category_id', 'blog_author_id', 'title', 'slug', 'excerpt', 'published_at', 'updated_at'])
            ->with(['category:id,name', 'author:id,display_name'])
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(self::LIMIT)
            ->get();

        $title = config()->string('blog.title', 'HalalBenta Blog');
        $intro = mb_trim(config()->string('blog.intro', ''));
        $description = $intro !== '' ? $intro : 'Halal shopping guides, recipes, seasonal ideas and tips from the HalalBenta marketplace in the Philippines.';
        $newest = $posts->first();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">'."\n";
        $xml .= "  <channel>\n";
        $xml .= '    <title>'.$this->escape($title)."</title>\n";
        $xml .= '    <link>'.$this->escape(BlogSeo::url())."</link>\n";
        $xml .= '    <description>'.$this->escape($description)."</description>\n";
        $xml .= "    <language>en-PH</language>\n";
        $xml .= '    <atom:link href="'.$this->escape(self::url()).'" rel="self" type="application/rss+xml"/>'."\n";

        if ($newest?->published_at !== null) {
            $xml .= '    <lastBuildDate>'.Carbon::parse($newest->published_at)->toRssString()."</lastBuildDate>\n";
        }

        foreach ($posts as $post) {
            $url = BlogSeo::url($post->slug);

            $xml .= "    <item>\n";
            $xml .= '      <title>'.$this->escape($post->title)."</title>\n";
            $xml .= '      <link>'.$this->escape($url)."</link>\n";
            $xml .= '      <guid isPermaLink="true">'.$this->escape($url)."</guid>\n";
            if ($post->published_at !== null) {
                $xml .= '      <pubDate>'.Carbon::parse($post->published_at)->toRssString()."</pubDate>\n";
            }
            $xml .= '      <dc:creator>'.$this->escape($post->author->display_name)."</dc:creator>\n";
            if ($post->category !== null) {
                $xml .= '      <category>'.$this->escape($post->category->name)."</category>\n";
            }
            $xml .= '      <description>'.$this->escape($post->excerpt)."</description>\n";
            $xml .= "    </item>\n";
        }

        return $xml."  </channel>\n</rss>";
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
