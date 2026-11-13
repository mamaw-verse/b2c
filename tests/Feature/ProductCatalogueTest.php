<?php

declare(strict_types=1);

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
        'name' => 'Barakah Pantry',
        'slug' => 'barakah-pantry-'.Str::random(6),
    ]);

    $this->category = Category::first() ?? Category::create([
        'name' => 'Halal Food',
        'slug' => 'halal-food',
        'icon' => 'utensils',
        'sort_order' => 1,
    ]);
});

test('seller can create product with uploaded images', function () {
    Storage::fake('public');

    $file1 = UploadedFile::fake()->image('photo1.jpg', 600, 600);
    $file2 = UploadedFile::fake()->image('photo2.png', 600, 600);

    $payload = [
        'name' => 'Premium Ajwa Dates',
        'category_id' => $this->category->id,
        'description' => 'Fresh imported dates',
        'price' => 500,
        'stock' => 20,
        'weight' => 0.5,
        'images' => [$file1, $file2],
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('shop_id', $this->shop->id)->where('name', 'Premium Ajwa Dates')->first();
    expect($product)->not->toBeNull();

    $images = $product->images;
    expect($images)->toHaveCount(2);
    expect($images[0]->url)->not->toBeEmpty();
    expect($images[1]->url)->not->toBeEmpty();
    expect($images[0]->sort_order)->toBe(0);
    expect($images[1]->sort_order)->toBe(1);

    // Verify storage
    $path1 = Str::after($images[0]->url, '/storage/');
    $path2 = Str::after($images[1]->url, '/storage/');
    Storage::disk('public')->assertExists($path1);
    Storage::disk('public')->assertExists($path2);
});

test('seller can update product images by keeping existing ones and adding new ones', function () {
    Storage::fake('public');

    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
    ]);

    $path1 = UploadedFile::fake()->image('existing1.jpg')->store('product-images', 'public');
    $path2 = UploadedFile::fake()->image('existing2.jpg')->store('product-images', 'public');

    $img1 = $product->images()->create([
        'url' => Storage::disk('public')->url($path1),
        'icon' => 'package',
        'sort_order' => 0,
    ]);

    $img2 = $product->images()->create([
        'url' => Storage::disk('public')->url($path2),
        'icon' => 'package',
        'sort_order' => 1,
    ]);

    $newFile = UploadedFile::fake()->image('new.jpg');

    // Keep img2 only, drop img1, add newFile
    $response = $this->actingAs($this->sellerUser)
        ->put(route('seller.products.update', $product), [
            'name' => 'Updated Dates',
            'category_id' => $this->category->id,
            'description' => 'Updated Description',
            'price' => 500,
            'stock' => 20,
            'weight' => 0.5,
            'keep_image_ids' => [$img2->id],
            'images' => [$newFile],
        ]);

    $response->assertRedirect(route('seller.products.index'));

    $product->refresh();
    expect($product->images)->toHaveCount(2);
    expect($product->images->pluck('id'))->toContain($img2->id);
    expect($product->images->pluck('id'))->not->toContain($img1->id);

    // Removed file should be deleted from storage
    Storage::disk('public')->assertMissing($path1);
    Storage::disk('public')->assertExists($path2);
});

test('seller product creation preserves option names for variations', function () {
    $payload = [
        'name' => 'Variant Product',
        'category_id' => $this->category->id,
        'description' => 'Product with variations',
        'weight' => 1.0,
        'option1_name' => 'Size',
        'option2_name' => 'Colour',
        'variations' => [
            ['option1_value' => 'Small', 'option2_value' => 'Red', 'price' => 100, 'stock' => 5],
            ['option1_value' => 'Large', 'option2_value' => 'Blue', 'price' => 150, 'stock' => 10],
        ],
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Variant Product')->first();
    expect($product->option1_name)->toBe('Size');
    expect($product->option2_name)->toBe('Colour');
    expect($product->variations()->count())->toBe(2);
});

test('backfill migration sets option names on products with variations and null option names', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'option1_name' => null,
        'option2_name' => null,
    ]);

    ProductVariation::create([
        'product_id' => $product->id,
        'option1_value' => '500g',
        'option2_value' => 'Box',
        'price' => 10000,
        'stock' => 5,
        'sort_order' => 0,
    ]);

    // Run backfill logic
    DB::table('products')
        ->whereNull('option1_name')
        ->whereExists(function ($query) {
            $query->select(DB::raw(1))
                ->from('product_variations')
                ->whereColumn('product_variations.product_id', 'products.id');
        })
        ->update(['option1_name' => 'Option']);

    DB::table('products')
        ->whereNull('option2_name')
        ->whereExists(function ($query) {
            $query->select(DB::raw(1))
                ->from('product_variations')
                ->whereColumn('product_variations.product_id', 'products.id')
                ->whereNotNull('option2_value')
                ->where('option2_value', '!=', '');
        })
        ->update(['option2_name' => 'Option 2']);

    $product->refresh();
    expect($product->option1_name)->toBe('Option');
    expect($product->option2_name)->toBe('Option 2');
});

test('seller can create product with sale price and regular price', function () {
    $payload = [
        'name' => 'Discounted Item',
        'category_id' => $this->category->id,
        'description' => 'On sale now',
        'weight' => 0.5,
        'price' => 100, // Regular price
        'sale_price' => 80, // Sale price
        'stock' => 10,
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Discounted Item')->first();
    expect($product->price)->toBe(8000); // 80 pesos in centavos (buyer pays this)
    expect($product->was_price)->toBe(10000); // 100 pesos in centavos (struck through)
});

test('sale price must be less than regular price', function () {
    $payload = [
        'name' => 'Invalid Discount Item',
        'category_id' => $this->category->id,
        'description' => 'Invalid sale price',
        'weight' => 0.5,
        'price' => 100,
        'sale_price' => 120, // Greater than price
        'stock' => 10,
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertSessionHasErrors('sale_price');
});

test('product with variations derives base price and was_price from cheapest variation', function () {
    $payload = [
        'name' => 'Multi-variant Sale Item',
        'category_id' => $this->category->id,
        'description' => 'Variations with sales',
        'weight' => 1.0,
        'option1_name' => 'Size',
        'variations' => [
            [
                'option1_value' => 'Small',
                'price' => 100,
                'sale_price' => 70, // cheapest (7000 centavos)
                'stock' => 5,
            ],
            [
                'option1_value' => 'Medium',
                'price' => 120,
                'sale_price' => 90,
                'stock' => 5,
            ],
            [
                'option1_value' => 'Large',
                'price' => 150,
                'stock' => 5, // 15000 centavos
            ],
        ],
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Multi-variant Sale Item')->first();
    expect($product->price)->toBe(7000);
    expect($product->was_price)->toBe(10000);

    $vars = $product->variations()->orderBy('sort_order')->get();
    expect($vars[0]->price)->toBe(7000);
    expect($vars[0]->was_price)->toBe(10000);
    expect($vars[1]->price)->toBe(9000);
    expect($vars[1]->was_price)->toBe(12000);
    expect($vars[2]->price)->toBe(15000);
    expect($vars[2]->was_price)->toBeNull();
});

test('seller index and product edit contain mapped image urls and sale prices', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'price' => 8000,
        'was_price' => 10000,
    ]);

    $product->images()->create([
        'url' => 'https://example.com/product.jpg',
        'icon' => 'package',
        'sort_order' => 0,
    ]);

    // Test edit page
    $this->actingAs($this->sellerUser)
        ->get(route('seller.products.edit', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/form')
            ->where('product.price', 100)
            ->where('product.sale_price', 80)
            ->where('product.images.0.url', 'https://example.com/product.jpg')
        );

    // Test seller index page
    $this->actingAs($this->sellerUser)
        ->get(route('seller.products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/index')
            ->where('products.data.0.image_url', 'https://example.com/product.jpg')
        );
});
