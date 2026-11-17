<?php

declare(strict_types=1);

use App\Enums\ShopStaffStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Media;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('marketplace.features.product_video_enabled', true);
    Config::set('services.clamav.enabled', false);
    Config::set('filesystems.media_disk', 's3');
    Storage::fake('s3');
    Storage::fake('public');
});

/**
 * @return array{0: User, 1: Shop, 2: Product}
 */
function videoUploadFixture(): array
{
    $owner = User::factory()->create(['email_verified_at' => now()]);
    $shop = Shop::factory()->create(['user_id' => $owner->id, 'status' => ShopStatus::Approved]);
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'published' => true,
    ]);

    return [$owner, $shop, $product];
}

test('an owner can upload an accepted video through product update', function (string $filename, string $mime, string $expectedMime): void {
    [$owner, , $product] = videoUploadFixture();

    $response = $this->actingAs($owner)
        ->put(route('seller.products.update', $product), [
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'stock' => $product->stock,
            'location' => $product->location,
            'halal_status' => $product->halal_status->value,
            'video' => UploadedFile::fake()->create($filename, 100, $mime),
        ]);

    $response->assertRedirect();
    $product->refresh();
    $media = $product->video;

    expect($media)->not->toBeNull()
        ->and($media->scan_status)->toBe('clean')
        ->and($media->mime_type)->toBe($expectedMime)
        ->and($media->uploaded_by_id)->toBe($owner->id)
        ->and(Product::query()->where('video_media_id', $media->id)->count())->toBe(1);

    Storage::disk('s3')->assertExists($media->storage_path);
})->with([
    ['clip.mp4', 'video/mp4', 'video/mp4'],
    ['clip.webm', 'video/webm', 'video/webm'],
]);

test('active staff can upload a video to their shop product', function (): void {
    [$owner, $shop, $product] = videoUploadFixture();
    $staff = User::factory()->create(['email_verified_at' => now()]);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
    ]);

    $response = $this->actingAs($staff)
        ->put(route('seller.products.update', $product), [
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'stock' => $product->stock,
            'location' => $product->location,
            'halal_status' => $product->halal_status->value,
            'video' => UploadedFile::fake()->create('staff-clip.mp4', 100, 'video/mp4'),
        ]);

    $response->assertRedirect();
    $product->refresh();
    expect($product->video)->not->toBeNull()
        ->and($product->video->uploaded_by_id)->toBe($staff->id);

    Storage::disk('s3')->assertExists($product->video->storage_path);
});

test('a MOV upload is rejected and nothing is linked', function (): void {
    [$owner, , $product] = videoUploadFixture();

    $response = $this->actingAs($owner)
        ->put(route('seller.products.update', $product), [
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'stock' => $product->stock,
            'location' => $product->location,
            'halal_status' => $product->halal_status->value,
            'video' => UploadedFile::fake()->create('clip.mov', 100, 'video/quicktime'),
        ]);

    $response->assertSessionHasErrors('video');
    expect($product->fresh()->video_media_id)->toBeNull();
});

test('removing video detaches media and deletes s3 object', function (): void {
    [$owner, , $product] = videoUploadFixture();
    $media = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/old-video.mp4',
    ]);
    Storage::disk('s3')->put('media/old-video.mp4', 'dummy video');
    $product->update(['video_media_id' => $media->id]);

    $response = $this->actingAs($owner)
        ->put(route('seller.products.update', $product), [
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'stock' => $product->stock,
            'location' => $product->location,
            'halal_status' => $product->halal_status->value,
            'remove_video' => true,
        ]);

    $response->assertRedirect();
    $product->refresh();

    expect($product->video_media_id)->toBeNull()
        ->and($product->video)->toBeNull();

    Storage::disk('s3')->assertMissing('media/old-video.mp4');
});

test('replacing video updates video_media_id and removes previous s3 object', function (): void {
    [$owner, , $product] = videoUploadFixture();
    $oldMedia = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/old-clip.mp4',
    ]);
    Storage::disk('s3')->put('media/old-clip.mp4', 'old video');
    $product->update(['video_media_id' => $oldMedia->id]);

    $response = $this->actingAs($owner)
        ->put(route('seller.products.update', $product), [
            'name' => $product->name,
            'category_id' => $product->category_id,
            'description' => $product->description,
            'price' => $product->price / 100,
            'stock' => $product->stock,
            'location' => $product->location,
            'halal_status' => $product->halal_status->value,
            'video' => UploadedFile::fake()->create('new-clip.mp4', 100, 'video/mp4'),
        ]);

    $response->assertRedirect();
    $product->refresh();

    expect($product->video_media_id)->not->toBe($oldMedia->id)
        ->and($product->video)->not->toBeNull();

    Storage::disk('s3')->assertMissing('media/old-clip.mp4');
    Storage::disk('s3')->assertExists($product->video->storage_path);
});
