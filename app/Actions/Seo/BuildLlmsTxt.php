<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Models\Category;
use App\Support\SeoData;
use App\Support\TrustFacts;
use Illuminate\Support\Facades\Cache;

/**
 * Builds /llms.txt (docs/planning/14 T4.2): a short Markdown map of the marketplace for LLM-based
 * answer engines. It is a low-cost, unproven signal, so it stays small, accurate and link-only:
 * every URL is public and indexable, and every fact comes from TrustFacts / config.
 */
final readonly class BuildLlmsTxt
{
    public const string CACHE_KEY = 'llms:txt';

    /**
     * Whether /llms.txt should be served. Mirrors robots.txt: never outside production or when noindex is forced.
     */
    public function isAvailable(): bool
    {
        return app()->isProduction() && ! (bool) config('seo.force_noindex', false);
    }

    public function handle(): string
    {
        return Cache::remember(self::CACHE_KEY, 3600, fn (): string => $this->render());
    }

    private function render(): string
    {
        $origin = SeoData::canonicalOrigin();
        $name = (string) config('seo.site_name', 'HalalBenta');

        $lines = [
            "# {$name}",
            '',
            '> '.(string) config('seo.description'),
            '',
            "{$name} is an online marketplace where independent sellers list halal products for buyers in the Philippines. "
            .'Product pages show the seller, price, stock and, where the seller provides one, halal certificate details.',
            '',
            '## Key facts',
            '',
        ];

        foreach (TrustFacts::statements() as $fact) {
            $lines[] = "- {$fact['label']}: {$fact['text']}";
        }

        $lines[] = '';

        $categories = Category::query()
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('slug')
            ->get(['name', 'slug']);

        if ($categories->isNotEmpty()) {
            $lines[] = '## Shop by category';
            $lines[] = '';
            foreach ($categories as $category) {
                $lines[] = "- [{$category->name}]({$origin}/categories/{$category->slug})";
            }
            $lines[] = '';
        }

        $lines[] = '## About and policies';
        $lines[] = '';
        $lines[] = "- [Why choose {$name}]({$origin}/why-choose-us): Buyer protection, halal and delivery overview";

        foreach ($this->enabledPages() as $key => $title) {
            $lines[] = "- [{$title}]({$origin}/pages/{$key})";
        }

        $lines[] = "- [Seller terms]({$origin}/seller/terms): Terms for businesses that want to sell on {$name}";
        $lines[] = '';
        $lines[] = '## Directory';
        $lines[] = '';
        $lines[] = "- [Sellers]({$origin}/sellers): Approved shops on the marketplace";
        $lines[] = "- [Sitemap]({$origin}/sitemap.xml): Every public category, shop and product";

        return implode("\n", $lines)."\n";
    }

    /**
     * Content pages switched on in config/marketplace.php, keyed by URL segment.
     *
     * @return array<string, string>
     */
    private function enabledPages(): array
    {
        $pages = [];

        foreach (config()->array('marketplace.pages', []) as $key => $page) {
            if (is_array($page) && ($page['enabled'] ?? false) === true) {
                $pages[(string) $key] = (string) ($page['title'] ?? ucfirst(str_replace('-', ' ', (string) $key)));
            }
        }

        return $pages;
    }
}
