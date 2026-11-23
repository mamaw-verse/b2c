<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;

/**
 * Generates robots.txt from config/seo.php so robots.txt, <meta robots> and
 * X-Robots-Tag are driven by the same path lists.
 */
final readonly class BuildRobotsTxt
{
    public function handle(): string
    {
        if (! app()->isProduction() || (bool) config('seo.force_noindex', false)) {
            return "User-agent: *\nDisallow: /\n";
        }

        $rules = $this->rules();

        $groups = [$this->group(['*'], $rules, allowAll: true)];

        if ((bool) config('seo.ai_crawlers.emit_groups', true)) {
            $search = array_map('strval', config()->array('seo.ai_crawlers.search', []));
            if ($search !== []) {
                $groups[] = $this->group($search, $rules, allowAll: true);
            }

            $training = array_map('strval', config()->array('seo.ai_crawlers.training', []));
            if ($training !== []) {
                $groups[] = (bool) config('seo.ai_crawlers.block_training', false)
                    ? $this->group($training, ['Disallow: /'])
                    : $this->group($training, $rules, allowAll: true);
            }
        }

        return implode("\n", $groups)."\nSitemap: ".SeoData::canonicalOrigin()."/sitemap.xml\n";
    }

    /**
     * @return array<int, string> Allow/Disallow lines shared by every user-agent group.
     */
    public function rules(): array
    {
        $rules = [];

        foreach (config()->array('seo.public_path_exceptions', []) as $path) {
            $rules[] = 'Allow: /'.mb_trim((string) $path, '/');
        }

        foreach (config()->array('seo.private_path_patterns', []) as $pattern) {
            $rules[] = 'Disallow: '.$this->toRobotsPath((string) $pattern);
        }

        foreach (config()->array('seo.noindex_follow_paths', []) as $path) {
            $rules[] = 'Disallow: /'.mb_trim((string) $path, '/');
        }

        foreach (config()->array('seo.disallowed_query_params', []) as $param) {
            $rules[] = 'Disallow: /*?*'.$param.'=';
        }

        return array_values(array_unique($rules));
    }

    /**
     * @param  array<int, string>  $agents
     * @param  array<int, string>  $rules
     */
    private function group(array $agents, array $rules, bool $allowAll = false): string
    {
        $lines = array_map(fn (string $agent): string => "User-agent: {$agent}", $agents);

        if ($allowAll) {
            $lines[] = 'Allow: /';
        }

        return implode("\n", [...$lines, ...$rules])."\n";
    }

    /**
     * `cart*` → `/cart`, `seller/*` → `/seller/`, `login` → `/login` (robots.txt is prefix-matched).
     */
    private function toRobotsPath(string $pattern): string
    {
        $path = '/'.mb_ltrim($pattern, '/');

        return str_ends_with($path, '*') ? mb_rtrim($path, '*') : $path;
    }
}
