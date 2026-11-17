<?php

declare(strict_types=1);

use App\Jobs\ReconcileMediaOrphansJob;
use App\Models\Category;
use App\Models\Media;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('filesystems.media_disk', 's3');
    Storage::fake('s3');
});

test('orphan reconciliation deletes unreferenced media older than grace period', function (): void {
    Carbon::setTestNow('2026-11-14 12:00:00');

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $category = Category::factory()->create();

    // 1. Orphan older than 7 days
    $oldOrphan = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/old-orphan.mp4',
        'created_at' => Carbon::now()->subDays(10),
    ]);
    Storage::disk('s3')->put('media/old-orphan.mp4', 'dummy old');

    // 2. Active media referenced by product
    $activeMedia = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/active.mp4',
        'created_at' => Carbon::now()->subDays(10),
    ]);
    Storage::disk('s3')->put('media/active.mp4', 'dummy active');
    Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'video_media_id' => $activeMedia->id,
    ]);

    // 3. Recent orphan (under 7 days)
    $recentOrphan = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/recent-orphan.mp4',
        'created_at' => Carbon::now()->subDays(2),
    ]);
    Storage::disk('s3')->put('media/recent-orphan.mp4', 'dummy recent');

    (new ReconcileMediaOrphansJob)->handle();

    // Assertions
    expect(Media::find($oldOrphan->id))->toBeNull()
        ->and(Media::find($activeMedia->id))->not->toBeNull()
        ->and(Media::find($recentOrphan->id))->not->toBeNull();

    Storage::disk('s3')->assertMissing('media/old-orphan.mp4');
    Storage::disk('s3')->assertExists('media/active.mp4');
    Storage::disk('s3')->assertExists('media/recent-orphan.mp4');
});

test('purge videos command dry run and forced execution', function (): void {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $category = Category::factory()->create();

    $media = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'test-videos/sample.mp4',
        'mime_type' => 'video/mp4',
    ]);
    Storage::disk('s3')->put('test-videos/sample.mp4', 'sample video');

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'video_media_id' => $media->id,
    ]);

    // Dry run
    $this->artisan('media:purge-videos --prefix=test-videos')
        ->expectsOutputToContain('Would delete 1 video(s)')
        ->assertSuccessful();

    expect(Media::find($media->id))->not->toBeNull()
        ->and($product->fresh()->video_media_id)->toBe($media->id);

    // Force purge
    $this->artisan('media:purge-videos --prefix=test-videos --force')
        ->expectsOutputToContain('Deleted 1 video(s)')
        ->assertSuccessful();

    expect(Media::find($media->id))->toBeNull()
        ->and($product->fresh()->video_media_id)->toBeNull();

    Storage::disk('s3')->assertMissing('test-videos/sample.mp4');
});
