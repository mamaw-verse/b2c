<?php

declare(strict_types=1);

use App\Models\Category;
use App\Models\Media;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('media factory creates a valid media record with ulid and defaults', function (): void {
    $user = User::factory()->create();
    $media = Media::factory()->create(['uploaded_by_id' => $user->id]);

    expect($media->id)->not->toBeEmpty()
        ->and(mb_strlen($media->id))->toBe(26)
        ->and($media->original_filename)->toBe('product.mp4')
        ->and($media->extension)->toBe('mp4')
        ->and($media->mime_type)->toBe('video/mp4')
        ->and($media->scan_status)->toBe('clean')
        ->and($media->uploadedBy->id)->toBe($user->id);
});

test('media factory states configure pending, infected, and webm files', function (): void {
    $pending = Media::factory()->pending()->create();
    $infected = Media::factory()->infected()->create();
    $webm = Media::factory()->webm()->create();

    expect($pending->scan_status)->toBe('pending')
        ->and($infected->scan_status)->toBe('infected')
        ->and($webm->extension)->toBe('webm')
        ->and($webm->mime_type)->toBe('video/webm');
});

test('product belongs to video media and media has video products relation', function (): void {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $category = Category::factory()->create();
    $media = Media::factory()->create(['uploaded_by_id' => $owner->id]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'video_media_id' => $media->id,
    ]);

    expect($product->video)->not->toBeNull()
        ->and($product->video->id)->toBe($media->id)
        ->and($media->videoProducts)->toHaveCount(1)
        ->and($media->videoProducts->first()->id)->toBe($product->id);
});

test('deleting media sets product video_media_id to null', function (): void {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $category = Category::factory()->create();
    $media = Media::factory()->create(['uploaded_by_id' => $owner->id]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'video_media_id' => $media->id,
    ]);

    $media->delete();

    expect($product->fresh()->video_media_id)->toBeNull()
        ->and($product->fresh()->video)->toBeNull();
});
