<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Actions\Seller\DeleteSellerProduct;
use App\Actions\Seller\SyncProductVideo;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
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

test('sync product video stores file and updates columns', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'video_path' => null,
        'video_duration' => null,
    ]);

    $file = UploadedFile::fake()->create('intro.mp4', 1024, 'video/mp4');

    app(SyncProductVideo::class)->handle($product, $file, false, 25);

    $product->refresh();
    expect($product->video_path)->not->toBeNull()
        ->and($product->video_duration)->toBe(25);

    Storage::disk('public')->assertExists($product->video_path);
});

test('sync product video replaces existing file and deletes the old one', function () {
    $product = Product::factory()->create(['shop_id' => $this->shop->id]);

    $file1 = UploadedFile::fake()->create('first.mp4', 500, 'video/mp4');
    app(SyncProductVideo::class)->handle($product, $file1, false, 15);
    $product->refresh();
    $oldPath = $product->video_path;
    Storage::disk('public')->assertExists($oldPath);

    $file2 = UploadedFile::fake()->create('second.mp4', 800, 'video/mp4');
    app(SyncProductVideo::class)->handle($product, $file2, false, 30);
    $product->refresh();
    $newPath = $product->video_path;

    expect($newPath)->not->toBe($oldPath)
        ->and($product->video_duration)->toBe(30);

    Storage::disk('public')->assertExists($newPath);
    Storage::disk('public')->assertMissing($oldPath);
});

test('sync product video remove clears columns and deletes file', function () {
    $product = Product::factory()->create(['shop_id' => $this->shop->id]);

    $file = UploadedFile::fake()->create('video.mp4', 500, 'video/mp4');
    app(SyncProductVideo::class)->handle($product, $file, false, 20);
    $product->refresh();
    $path = $product->video_path;
    Storage::disk('public')->assertExists($path);

    app(SyncProductVideo::class)->handle($product, null, true);
    $product->refresh();

    expect($product->video_path)->toBeNull()
        ->and($product->video_duration)->toBeNull();

    Storage::disk('public')->assertMissing($path);
});

test('sync product video cleans up file if transaction rolls back', function () {
    $product = Product::factory()->create(['shop_id' => $this->shop->id]);
    $file = UploadedFile::fake()->create('failed.mp4', 500, 'video/mp4');
    $capturedPath = null;

    try {
        DB::transaction(function () use ($product, $file, &$capturedPath) {
            app(SyncProductVideo::class)->handle($product, $file, false, 10);
            $product->refresh();
            $capturedPath = $product->video_path;
            throw new Exception('Rollback test');
        });
    } catch (Exception) {
        // Expected rollback
    }

    expect($capturedPath)->not->toBeNull();
    Storage::disk('public')->assertMissing($capturedPath);
});

test('creating product rejects bad video mime type', function () {
    $file = UploadedFile::fake()->create('document.txt', 500, 'text/plain');

    $response = $this->actingAs($this->seller)->post(route('seller.products.store'), [
        'name' => 'Bad Video Product',
        'category_id' => $this->category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'video' => $file,
    ]);

    $response->assertSessionHasErrors(['video']);
});

test('creating product rejects video over 30MB', function () {
    // 31MB = 31 * 1024 = 31744 KB
    $file = UploadedFile::fake()->create('oversize.mp4', 31744, 'video/mp4');

    $response = $this->actingAs($this->seller)->post(route('seller.products.store'), [
        'name' => 'Oversize Video Product',
        'category_id' => $this->category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'video' => $file,
    ]);

    $response->assertSessionHasErrors(['video']);
});

test('creating product rejects array of videos', function () {
    $file1 = UploadedFile::fake()->create('video1.mp4', 500, 'video/mp4');
    $file2 = UploadedFile::fake()->create('video2.mp4', 500, 'video/mp4');

    $response = $this->actingAs($this->seller)->post(route('seller.products.store'), [
        'name' => 'Array Video Product',
        'category_id' => $this->category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'video' => [$file1, $file2],
    ]);

    $response->assertSessionHasErrors(['video']);
});

test('creating product with valid video stores file and metadata', function () {
    $file = UploadedFile::fake()->create('product.mp4', 2048, 'video/mp4');

    $response = $this->actingAs($this->seller)->post(route('seller.products.store'), [
        'name' => 'Valid Video Product',
        'category_id' => $this->category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'video' => $file,
        'video_duration' => 45,
    ]);

    $response->assertRedirect(route('seller.products.index'));

    $product = Product::where('name', 'Valid Video Product')->firstOrFail();
    expect($product->video_path)->not->toBeNull()
        ->and($product->video_duration)->toBe(45);

    Storage::disk('public')->assertExists($product->video_path);
});

test('updating product of another shop returns 404', function () {
    $otherSeller = User::factory()->create();
    $otherShop = Shop::factory()->create(['user_id' => $otherSeller->id]);
    $otherProduct = Product::factory()->create(['shop_id' => $otherShop->id]);

    $response = $this->actingAs($this->seller)->put(route('seller.products.update', $otherProduct), [
        'name' => 'Hijacked Name',
    ]);

    $response->assertNotFound();
});

test('updating product without video leaves existing video intact', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'name' => 'Original Name',
        'video_path' => 'product-videos/original.mp4',
        'video_duration' => 20,
    ]);
    Storage::disk('public')->put('product-videos/original.mp4', 'dummy video');

    $response = $this->actingAs($this->seller)->put(route('seller.products.update', $product), [
        'name' => 'Updated Name',
    ]);

    $response->assertRedirect(route('seller.products.index'));

    $product->refresh();
    expect($product->name)->toBe('Updated Name')
        ->and($product->video_path)->toBe('product-videos/original.mp4')
        ->and($product->video_duration)->toBe(20);

    Storage::disk('public')->assertExists('product-videos/original.mp4');
});

test('updating product with remove_video clears video and deletes file', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'video_path' => 'product-videos/to-remove.mp4',
        'video_duration' => 25,
    ]);
    Storage::disk('public')->put('product-videos/to-remove.mp4', 'dummy video');

    $response = $this->actingAs($this->seller)->put(route('seller.products.update', $product), [
        'name' => $product->name,
        'remove_video' => true,
    ]);

    $response->assertRedirect(route('seller.products.index'));

    $product->refresh();
    expect($product->video_path)->toBeNull()
        ->and($product->video_duration)->toBeNull();

    Storage::disk('public')->assertMissing('product-videos/to-remove.mp4');
});

test('delete seller product removes video and image files from disk', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'video_path' => 'product-videos/del-test.mp4',
        'video_duration' => 15,
    ]);
    Storage::disk('public')->put('product-videos/del-test.mp4', 'dummy video');

    $imagePath = 'product-images/photo1.jpg';
    Storage::disk('public')->put($imagePath, 'dummy image');
    $product->images()->create([
        'url' => Storage::disk('public')->url($imagePath),
        'icon' => 'package',
        'sort_order' => 0,
    ]);

    app(DeleteSellerProduct::class)->handle($product);

    expect(Product::find($product->id))->toBeNull();
    Storage::disk('public')->assertMissing('product-videos/del-test.mp4');
    Storage::disk('public')->assertMissing($imagePath);
});

test('moderator preview includes product video details', function () {
    $product = Product::factory()->withVideo()->create(['shop_id' => $this->shop->id]);
    $item = \App\Models\ModerationQueueItem::create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'type' => \App\Enums\ModerationItemType::Halal->value,
        'state' => \App\Enums\ModerationState::Pending->value,
        'reason_code' => 'halal_review',
        'flagged_by_type' => (new User)->getMorphClass(),
        'flagged_by_id' => $this->seller->id,
    ]);

    $data = app(\App\Actions\Moderation\ShowModerationItem::class)->handle($item);

    expect($data['preview']['kind'])->toBe('product')
        ->and($data['preview']['snapshot']['video'])->not->toBeNull()
        ->and($data['preview']['snapshot']['video']['duration'])->toBe(30)
        ->and($data['preview']['snapshot']['video']['url'])->toBe(Storage::disk('public')->url('product-videos/sample.mp4'));
});
