<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\ListBlogIndex;
use App\Actions\Seo\BuildBlogIndexSeoData;
use App\Http\Requests\Blog\ShowBlogIndexRequest;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class BlogController
{
    /**
     * The blog home: featured hero, category chips, latest grid, popular rail and `?q=` search.
     */
    public function index(ShowBlogIndexRequest $request, ListBlogIndex $index, BuildBlogIndexSeoData $buildSeoData, Seo $seo): Response
    {
        $term = $request->term();
        $data = $index->handle($request->pageNumber(), $term);

        /** @var list<array{slug: string, title: string, image: array{src: string}|null}> $cards */
        $cards = $data['posts']['data'];

        $seoData = $buildSeoData->handle($data['posts']['meta'], $term, $cards);
        $seo->set($seoData);

        $intro = mb_trim(config()->string('blog.intro', ''));

        return Inertia::render('blog/index', [
            'mode' => 'index',
            'heading' => config()->string('blog.title', 'HalalBenta Blog'),
            'intro' => $intro === '' ? null : $intro,
            'slug' => null,
            'q' => $term,
            'active_category' => null,
            'categories' => $data['categories'],
            'hero' => $data['hero'],
            'popular' => $data['popular'],
            'posts' => $data['posts'],
            'total_live' => $data['total_live'],
        ])->withViewData(['seo' => $seoData]);
    }
}
