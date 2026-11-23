<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\ListCategoryProducts;
use App\Actions\Seo\BuildCategorySeoData;
use App\Http\Requests\ShowCategoryRequest;
use App\Models\Category;
use App\Support\CategoryIntro;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class CategoryController
{
    /**
     * Show a category listing page.
     */
    public function show(
        ShowCategoryRequest $request,
        Category $category,
        ListCategoryProducts $products,
        BuildCategorySeoData $buildSeoData,
        Seo $seo
    ): Response {
        $category->load(['parent:id,name,slug', 'children:id,parent_id,name,slug']);

        $sort = $request->sort();
        $halalOnly = $request->halalOnly();
        $total = $products->total($category, $halalOnly);

        $seoData = $buildSeoData->handle($category, $total, $request);
        $seo->set($seoData);

        return Inertia::render('category', [
            'category' => $category->only('id', 'name', 'slug') + [
                'parent' => $category->parent?->only('name', 'slug'),
                'children' => $category->children->map->only('id', 'name', 'slug'),
            ],
            'filters' => ['sort' => $sort, 'halal' => $halalOnly],
            'total' => $total,
            'intro' => CategoryIntro::for($category, $halalOnly ? $products->total($category, false) : $total),
            'products' => Inertia::scroll(fn () => $products->handle($category, $sort, $halalOnly)),
        ])->withViewData(['seo' => $seoData]);
    }
}
