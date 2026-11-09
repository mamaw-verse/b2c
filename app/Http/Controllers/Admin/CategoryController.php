<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateCategory;
use App\Actions\Admin\DeleteCategory;
use App\Actions\Admin\ListAdminCategories;
use App\Actions\Admin\UpdateCategory;
use App\Http\Requests\Admin\CreateCategoryRequest;
use App\Http\Requests\Admin\DeleteCategoryRequest;
use App\Http\Requests\Admin\ListAdminCategoriesRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class CategoryController
{
    public function index(ListAdminCategoriesRequest $request, ListAdminCategories $action): Response
    {
        return Inertia::render('admin/categories', $action->handle());
    }

    public function store(CreateCategoryRequest $request, CreateCategory $action): RedirectResponse
    {
        $action->handle($request->user(), $request->categoryData(), $request->ip());

        return redirect()->route('admin.categories.index')->with('success', 'Category created.');
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategory $action): RedirectResponse
    {
        $action->handle($category, $request->categoryData(), $request->user(), $request->ip());

        return redirect()->route('admin.categories.index')->with('success', 'Category updated.');
    }

    public function destroy(DeleteCategoryRequest $request, Category $category, DeleteCategory $action): RedirectResponse
    {
        $action->handle($category, $request->user(), $request->ip());

        return redirect()->route('admin.categories.index')->with('success', 'Category deleted.');
    }
}
