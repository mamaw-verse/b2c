<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->category = Category::factory()->create(['name' => 'Food', 'slug' => 'food']);
});

test('seller can store optional structured fields for answer engines', function () {
    $response = $this->actingAs($this->seller)
        ->post(route('seller.products.store'), [
            'name' => 'Organic Black Seed Oil',
            'brand' => 'Al Barakah',
            'gtin' => '5060123456789',
            'category_id' => $this->category->id,
            'description' => 'Cold pressed pure black seed oil 100ml.',
            'price' => 350,
            'stock' => 50,
            'weight' => 0.2,
            'country_of_origin' => 'Turkey',
            'storage_condition' => 'Store in a cool dry place away from sunlight',
            'ingredients' => '100% Nigella sativa seed oil',
            'allergens' => 'May contain traces of sesame',
            'published' => true,
        ]);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Organic Black Seed Oil')->first();

    expect($product)->not->toBeNull()
        ->and($product->brand)->toBe('Al Barakah')
        ->and($product->gtin)->toBe('5060123456789')
        ->and($product->country_of_origin)->toBe('Turkey')
        ->and($product->storage_condition)->toBe('Store in a cool dry place away from sunlight')
        ->and($product->ingredients)->toBe('100% Nigella sativa seed oil')
        ->and($product->allergens)->toBe('May contain traces of sesame');
});

test('seller can update structured product fields', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Original Dates',
        'price' => 20000,
        'stock' => 10,
        'weight' => 0.5,
    ]);

    $response = $this->actingAs($this->seller)
        ->put(route('seller.products.update', $product), [
            'name' => 'Updated Dates',
            'brand' => 'Madina Harvest',
            'gtin' => '9551234567890',
            'country_of_origin' => 'Saudi Arabia',
            'storage_condition' => 'Keep refrigerated',
            'allergens' => 'None',
            'ingredients' => 'Fresh dates',
            'price' => 250,
            'stock' => 15,
            'weight' => 0.5,
        ]);

    $response->assertRedirect(route('seller.products.index'));

    $updated = $product->fresh();

    expect($updated->brand)->toBe('Madina Harvest')
        ->and($updated->gtin)->toBe('9551234567890')
        ->and($updated->country_of_origin)->toBe('Saudi Arabia')
        ->and($updated->storage_condition)->toBe('Keep refrigerated')
        ->and($updated->allergens)->toBe('None')
        ->and($updated->ingredients)->toBe('Fresh dates');
});
