<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\CreateBlogCategory;
use App\Actions\Blog\Admin\DeleteBlogCategory;
use App\Actions\Blog\Admin\ListBlogCategories;
use App\Actions\Blog\Admin\UpdateBlogCategory;
use App\Http\Requests\Admin\CreateBlogCategoryRequest;
use App\Http\Requests\Admin\DeleteBlogCategoryRequest;
use App\Http\Requests\Admin\ListBlogCategoriesRequest;
use App\Http\Requests\Admin\UpdateBlogCategoryRequest;
use App\Models\BlogCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class BlogCategoryController
{
    public function index(ListBlogCategoriesRequest $request, ListBlogCategories $action): Response
    {
        return Inertia::render('admin/blog/categories', $action->handle());
    }

    public function store(CreateBlogCategoryRequest $request, CreateBlogCategory $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($admin, $request->categoryData(), $request->ip());

        return redirect()->route('admin.blog.categories.index')->with('success', 'Category created.');
    }

    public function update(UpdateBlogCategoryRequest $request, BlogCategory $category, UpdateBlogCategory $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($category, $admin, $request->categoryData(), $request->ip());

        return redirect()->route('admin.blog.categories.index')->with('success', 'Category updated.');
    }

    public function destroy(DeleteBlogCategoryRequest $request, BlogCategory $category, DeleteBlogCategory $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($category, $admin, $request->ip());

        return redirect()->route('admin.blog.categories.index')->with('success', 'Category deleted.');
    }
}
