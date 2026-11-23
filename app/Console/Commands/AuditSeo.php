<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Seo\AuditSeoPages;
use App\Support\SeoData;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Weekly SEO monitoring (docs/planning/14 T5.4). Exits non-zero and logs at `error`
 * level when anything regressed, so the scheduler and any log alerting can pick it up.
 */
final class AuditSeo extends Command
{
    /**
     * @var string
     */
    protected $signature = 'seo:audit
        {--sample=10 : Number of random products to sample}
        {--base-url= : Origin to audit (defaults to the canonical origin)}
        {--require-ssr : Fail, instead of warn, when a product name is missing from the server-rendered body}';

    /**
     * @var string
     */
    protected $description = 'Fetch live pages, validate JSON-LD, and check images, sitemaps, robots.txt and llms.txt';

    public function handle(AuditSeoPages $audit): int
    {
        $baseUrl = $this->option('base-url');
        $baseUrl = is_string($baseUrl) && $baseUrl !== '' ? $baseUrl : SeoData::canonicalOrigin();

        $sample = $this->option('sample');
        $sample = is_numeric($sample) ? max(0, (int) $sample) : 10;

        $this->info("Auditing {$baseUrl} (sample: {$sample} products)...");

        $report = $audit->handle($baseUrl, $sample, (bool) $this->option('require-ssr'));

        foreach ($report['warnings'] as $warning) {
            $this->warn("{$warning['url']}: {$warning['problem']}");
        }

        foreach ($report['failures'] as $failure) {
            $this->error("{$failure['url']}: {$failure['problem']}");
        }

        $this->line(sprintf(
            'Checked %d URLs: %d failure(s), %d warning(s).',
            $report['checked'],
            count($report['failures']),
            count($report['warnings']),
        ));

        if ($report['failures'] === []) {
            return self::SUCCESS;
        }

        Log::error('SEO audit found regressions.', [
            'base_url' => $baseUrl,
            'failures' => array_slice($report['failures'], 0, 50),
            'failure_count' => count($report['failures']),
        ]);

        return self::FAILURE;
    }
}
