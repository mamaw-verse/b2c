<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\CreateSellerProduct;
use App\Actions\Seller\DeleteSellerProduct;
use App\Actions\Seller\ListSellerProducts;
use App\Actions\Seller\UpdateSellerProduct;
use App\Http\Requests\Seller\CreateSellerProductRequest;
use App\Http\Requests\Seller\DeleteSellerProductRequest;
use App\Http\Requests\Seller\EditSellerProductRequest;
use App\Http\Requests\Seller\ListSellerProductsRequest;
use App\Http\Requests\Seller\ShowSellerDashboardRequest;
use App\Http\Requests\Seller\UpdateSellerProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController
{
    public function index(ListSellerProductsRequest $request, ListSellerProducts $action): Response
    {
        $shop = $request->user()->shop;
        $products = $action->handle($shop, $request->validated());

        return Inertia::render('seller/products/index', [
            'products' => $products,
            'filters' => $request->only('status', 'search', 'category', 'stock'),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(ShowSellerDashboardRequest $request): Response
    {
        return Inertia::render('seller/products/form', [
            'product' => null,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'certifying_bodies' => [
                'Islamic Da’wah Council of the Philippines (IDCP)',
                'Halal Development Institute of the Philippines (HDIP)',
                'Mindanao Halal Authority (MinHA)',
            ],
        ]);
    }

    public function store(CreateSellerProductRequest $request, CreateSellerProduct $action): RedirectResponse
    {
        $shop = $request->user()->shop;
        $product = $action->handle($shop, $request->validated());

        return redirect()->route('seller.products.index')->with('success', 'Product listed successfully.');
    }

    public function edit(EditSellerProductRequest $request, Product $product): Response
    {
        $product->load(['variations', 'halalCertification', 'images', 'category']);

        $productData = [
            'id' => $product->id,
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'was_price' => $product->was_price !== null ? $product->was_price / 100 : null,
            'stock' => $product->stock,
            'frozen' => $product->frozen,
            'free_shipping' => $product->free_shipping,
            'published' => $product->published,
            'has_variations' => $product->variations->isNotEmpty(),
            'halal_status' => $product->halal_status->value === 'certified' || $product->halal_status->value === 'review' ? 'certified' : ($product->halal_status->value === 'na' ? 'not_ingestible' : $product->halal_status->value),
            'certifying_body' => $product->halalCertification?->certifying_body,
            'certificate_number' => $product->halalCertification?->number,
            'valid_until' => $product->halalCertification?->valid_until?->toDateString(),
            'document_path' => $product->halalCertification?->document_path,
            'ingredients' => $product->ingredients,
            'no_pork_alcohol_declared' => $product->no_pork_alcohol_declared,
            'weight' => $product->weight,
            'length' => $product->length,
            'width' => $product->width,
            'height' => $product->height,
            'option1_name' => $product->option1_name,
            'option2_name' => $product->option2_name,
            'option1_values' => $product->variations->pluck('option1_value')->unique()->values()->all(),
            'option2_values' => $product->variations->pluck('option2_value')->filter()->unique()->values()->all(),
            'variations' => $product->variations->map(fn ($v) => [
                'option1_value' => $v->option1_value,
                'option2_value' => $v->option2_value,
                'price' => $v->price !== null ? $v->price / 100 : null,
                'stock' => $v->stock,
                'sku' => $v->sku,
            ]),
            'images' => $product->images->map(fn ($img) => [
                'name' => 'Image '.($img->sort_order + 1),
                'icon' => $img->icon,
            ]),
        ];

        return Inertia::render('seller/products/form', [
            'product' => $productData,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'certifying_bodies' => [
                'Islamic Da’wah Council of the Philippines (IDCP)',
                'Halal Development Institute of the Philippines (HDIP)',
                'Mindanao Halal Authority (MinHA)',
            ],
        ]);
    }

    public function update(UpdateSellerProductRequest $request, Product $product, UpdateSellerProduct $action): RedirectResponse
    {
        $action->handle($product, $request->validated());

        return redirect()->route('seller.products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(DeleteSellerProductRequest $request, Product $product, DeleteSellerProduct $action): RedirectResponse
    {
        $action->handle($product);

        return redirect()->route('seller.products.index')->with('success', 'Product deleted.');
    }
}
