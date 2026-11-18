<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

function variantProductPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Variant Tee',
        'category_id' => test()->category->id,
        'description' => 'A tee with variations',
        'weight' => 0.5,
        'length' => 30,
        'option1_name' => 'Size',
        'option2_name' => 'Colour',
        'published' => true,
        'variations' => [
            ['option1_value' => 'Large', 'option2_value' => 'Blue', 'price' => 200, 'stock' => 5],
            ['option1_value' => 'Large', 'option2_value' => 'Red', 'price' => 200, 'stock' => 5, 'weight' => 1.2, 'length' => 40],
        ],
    ], $overrides);
}

test('a product with variations is created when the default shipping is provided', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), variantProductPayload())
        ->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Variant Tee')->firstOrFail();

    expect($product->weight)->toBe(0.5)
        ->and($product->variations)->toHaveCount(2);
});

test('variations without their own shipping inherit the product defaults', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), variantProductPayload())
        ->assertRedirect(route('seller.products.index'));

    [$inherits, $overrides] = Product::where('name', 'Variant Tee')->firstOrFail()->variations->all();

    expect($inherits->weight)->toBeNull()
        ->and($inherits->effectiveWeight())->toBe(0.5)
        ->and($inherits->effectiveLength())->toBe(30.0)
        ->and($overrides->effectiveWeight())->toBe(1.2)
        ->and($overrides->effectiveLength())->toBe(40.0);
});

test('a missing default weight is reported on the weight field', function () {
    $payload = variantProductPayload();
    unset($payload['weight']);

    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), $payload)
        ->assertSessionHasErrors(['weight']);

    expect(Product::where('name', 'Variant Tee')->exists())->toBeFalse();
});

test('a sale price that is not lower than the regular price is reported on that variation', function () {
    $payload = variantProductPayload();
    $payload['variations'][1]['sale_price'] = 250;

    $response = $this->actingAs($this->seller)
        ->from(route('seller.products.create'))
        ->post(route('seller.products.store'), $payload);

    $response->assertSessionHasErrors(['variations.1.sale_price']);

    expect(session('errors')->first('variations.1.sale_price'))
        ->toContain('sale price must be lower than the regular price');
});

test('an invalid variation price and stock are reported per row', function () {
    $payload = variantProductPayload();
    $payload['variations'][0]['price'] = 0;
    $payload['variations'][1]['stock'] = -1;

    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), $payload)
        ->assertSessionHasErrors(['variations.0.price', 'variations.1.stock']);
});

test('updating a product keeps per-variation shipping overrides', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), variantProductPayload())
        ->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Variant Tee')->firstOrFail();

    $payload = variantProductPayload();
    $payload['variations'][0]['weight'] = 0.8;

    $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), $payload)
        ->assertRedirect();

    $weights = $product->fresh()->variations->map(fn ($v) => $v->weight)->all();

    expect($weights)->toBe([0.8, 1.2]);
});

test('the edit page returns the default shipping and the raw variation overrides', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.products.store'), variantProductPayload())
        ->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Variant Tee')->firstOrFail();

    $this->actingAs($this->seller)
        ->get(route('seller.products.edit', $product))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('product.weight', 0.5)
            ->where('product.variations.0.weight', null)
            ->where('product.variations.1.weight', 1.2));
});
