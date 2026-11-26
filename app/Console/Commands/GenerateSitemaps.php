<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Seo\BuildBlogSitemap;
use App\Actions\Seo\BuildCategoriesSitemap;
use App\Actions\Seo\BuildPagesSitemap;
use App\Actions\Seo\BuildProductsSitemap;
use App\Actions\Seo\BuildShopsSitemap;
use App\Actions\Seo\BuildSitemapIndex;
use App\Actions\Seo\InvalidateSitemapCache;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

final class GenerateSitemaps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate and write static sitemap XML files to public directory';

    public function handle(
        InvalidateSitemapCache $invalidator,
        BuildSitemapIndex $buildIndex,
        BuildPagesSitemap $buildPages,
        BuildCategoriesSitemap $buildCategories,
        BuildShopsSitemap $buildShops,
        BuildProductsSitemap $buildProducts,
        BuildBlogSitemap $buildBlog,
    ): int {
        $this->info('Invalidating sitemap caches...');
        $invalidator->handle();

        $publicPath = public_path();

        $this->info('Generating sitemap index...');
        File::put($publicPath.'/sitemap.xml', $buildIndex->handle());

        $this->info('Generating pages sitemap...');
        File::put($publicPath.'/sitemap-pages.xml', $buildPages->handle());

        $this->info('Generating categories sitemap...');
        File::put($publicPath.'/sitemap-categories.xml', $buildCategories->handle());

        $this->info('Generating shops sitemap...');
        File::put($publicPath.'/sitemap-shops.xml', $buildShops->handle());

        if (config()->boolean('blog.enabled', false)) {
            $this->info('Generating blog sitemap...');
            File::put($publicPath.'/sitemap-blog.xml', $buildBlog->handle());
        }

        $totalProducts = Product::visible()->count();
        $chunks = max(1, (int) ceil($totalProducts / 5000));

        for ($i = 1; $i <= $chunks; $i++) {
            $this->info("Generating products sitemap chunk {$i}...");
            File::put($publicPath."/sitemap-products-{$i}.xml", $buildProducts->handle($i));
        }

        $this->info('All sitemaps successfully generated.');

        return self::SUCCESS;
    }
}
