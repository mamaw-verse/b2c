<?php

declare(strict_types=1);

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('product stores video attributes and provides videoUrl accessor', function () {
    Storage::fake('public');

    $product = Product::factory()->create([
        'video_path' => null,
        'video_duration' => null,
    ]);

    expect($product->videoUrl())->toBeNull();

    $product->update([
        'video_path' => 'product-videos/test.mp4',
        'video_duration' => 45,
    ]);

    expect($product->fresh()->video_path)->toBe('product-videos/test.mp4')
        ->and($product->fresh()->video_duration)->toBe(45)
        ->and($product->fresh()->videoUrl())->toBe(Storage::disk('public')->url('product-videos/test.mp4'));
});

test('product factory withVideo state sets video path and duration', function () {
    $product = Product::factory()->withVideo()->create();

    expect($product->video_path)->toBe('product-videos/sample.mp4')
        ->and($product->video_duration)->toBe(30)
        ->and($product->videoUrl())->not->toBeNull();
});

test('toDetail includes video info while toCard and thumbnailUrl ignore video', function () {
    Storage::fake('public');

    $shop = Shop::factory()->create();
    $product = Product::factory()->withVideo()->create([
        'shop_id' => $shop->id,
    ]);

    ProductImage::factory()->create([
        'product_id' => $product->id,
        'url' => 'https://example.com/first-photo.jpg',
        'sort_order' => 0,
    ]);

    $detail = $product->fresh()->toDetail();
    expect($detail['video'])->toBe([
        'url' => Storage::disk('public')->url('product-videos/sample.mp4'),
        'duration' => 30,
    ]);

    $card = $product->fresh()->toCard();
    expect($card)->not->toHaveKey('video')
        ->and($card['image_url'])->toBe('https://example.com/first-photo.jpg')
        ->and($product->fresh()->thumbnailUrl())->toBe('https://example.com/first-photo.jpg');
});

test('toDetail sets video to null when product has no video', function () {
    $product = Product::factory()->create([
        'video_path' => null,
        'video_duration' => null,
    ]);

    $detail = $product->toDetail();
    expect($detail['video'])->toBeNull();
});

test('seller edit page props include video details', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $product = Product::factory()->withVideo()->create(['shop_id' => $shop->id]);

    $this->actingAs($seller)
        ->get("/seller/products/{$product->id}/edit")
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('seller/products/form')
                ->has('product.video')
                ->where('product.video.duration', 30)
        );
});
