<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->category = Category::first() ?? Category::create([
        'name' => 'Food',
        'slug' => 'food',
        'icon' => 'utensils',
        'sort_order' => 1,
    ]);
});

function createProductWithoutImages(): Product
{
    test()->actingAs(test()->seller)
        ->post(route('seller.products.store'), [
            'name' => 'Placeholder Product',
            'category_id' => test()->category->id,
            'description' => 'No photos yet',
            'weight' => 0.5,
            'price' => 100,
            'stock' => 5,
            'published' => true,
        ])
        ->assertRedirect(route('seller.products.index'));

    return Product::where('shop_id', test()->shop->id)->where('name', 'Placeholder Product')->firstOrFail();
}

function updatePayload(Product $product, array $extra = []): array
{
    return array_merge([
        'name' => $product->name,
        'category_id' => $product->category_id,
        'description' => 'No photos yet',
        'weight' => 0.5,
        'price' => 100,
        'stock' => 5,
    ], $extra);
}

test('a product created without photos has a single placeholder row', function () {
    $product = createProductWithoutImages();

    expect($product->images()->count())->toBe(1)
        ->and($product->images()->first()->url)->toBe('');
});

test('adding photos on edit removes the placeholder from the gallery and catalog', function () {
    $product = createProductWithoutImages();
    $placeholderId = $product->images()->first()->id;

    $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), updatePayload($product, [
            // The form sends only real images, never the placeholder id.
            'keep_image_ids' => [],
            'images' => [UploadedFile::fake()->image('one.jpg')],
        ]))
        ->assertRedirect();

    $product = $product->fresh(['images']);

    expect($product->images)->toHaveCount(1)
        ->and($product->images->pluck('id')->all())->not->toContain($placeholderId)
        ->and($product->images->first()->url)->not->toBe('')
        ->and($product->galleryImages())->toHaveCount(1)
        ->and($product->toDetail()['images'])->toHaveCount(1)
        ->and($product->toCard()['image_url'])->not->toBeNull();
});

test('a stale request that still keeps the placeholder id does not leave it behind', function () {
    $product = createProductWithoutImages();
    $placeholderId = $product->images()->first()->id;

    $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), updatePayload($product, [
            'keep_image_ids' => [$placeholderId],
            'images' => [UploadedFile::fake()->image('one.jpg'), UploadedFile::fake()->image('two.jpg')],
        ]))
        ->assertRedirect();

    $images = $product->fresh()->images;

    expect($images)->toHaveCount(2)
        ->and($images->where('url', '')->count())->toBe(0);
});

test('removing every photo restores a single placeholder', function () {
    $product = createProductWithoutImages();

    $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), updatePayload($product, [
            'images' => [UploadedFile::fake()->image('one.jpg')],
        ]))
        ->assertRedirect();

    $realId = $product->fresh()->images()->first()->id;
    expect($realId)->not->toBeNull();

    $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), updatePayload($product, [
            // Only an id that no longer matches anything: every real photo is removed.
            'keep_image_ids' => ['00000000-0000-0000-0000-000000000000'],
        ]))
        ->assertRedirect();

    $images = $product->fresh()->images;

    expect($images)->toHaveCount(1)
        ->and($images->first()->url)->toBe('');
});

test('the seller edit page does not receive placeholder rows', function () {
    $product = createProductWithoutImages();

    $this->actingAs($this->seller)
        ->get(route('seller.products.edit', $product))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('product.images', 0));
});

test('the cleanup migration removes placeholders next to real photos only', function () {
    $withPhoto = Product::factory()->create(['shop_id' => $this->shop->id]);
    $withPhoto->images()->delete();
    $withPhoto->images()->create(['url' => '', 'icon' => 'package', 'sort_order' => 0]);
    $withPhoto->images()->create(['url' => 'https://example.test/a.jpg', 'icon' => 'package', 'sort_order' => 1]);

    $onlyPlaceholder = Product::factory()->create(['shop_id' => $this->shop->id]);
    $onlyPlaceholder->images()->delete();
    $onlyPlaceholder->images()->create(['url' => '', 'icon' => 'package', 'sort_order' => 0]);

    $migration = require base_path('database/migrations/2026_11_18_000000_remove_placeholder_product_images.php');
    $migration->up();

    expect($withPhoto->images()->pluck('url')->all())->toBe(['https://example.test/a.jpg'])
        ->and($onlyPlaceholder->images()->count())->toBe(1);
});
