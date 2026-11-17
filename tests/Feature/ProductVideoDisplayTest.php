<?php

declare(strict_types=1);

use App\Actions\Moderation\ShowModerationItem;
use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Media;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('marketplace.features.product_video_enabled', true);
    Config::set('services.clamav.enabled', false);
    Config::set('filesystems.media_disk', 's3');
    Storage::fake('s3');
    Storage::fake('public');
});

/**
 * @return array{0: User, 1: Shop, 2: Product, 3: Media}
 */
function createProductWithVideoFixture(string $scanStatus = 'clean'): array
{
    $owner = User::factory()->create();
    $shop = Shop::factory()->create([
        'user_id' => $owner->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
    ]);
    $category = Category::factory()->create();
    $media = Media::factory()->create([
        'uploaded_by_id' => $owner->id,
        'storage_path' => 'media/storefront-video.mp4',
        'scan_status' => $scanStatus,
    ]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'video_media_id' => $media->id,
        'video_duration' => 45,
    ]);

    ProductImage::factory()->create([
        'product_id' => $product->id,
        'sort_order' => 0,
        'url' => 'https://example.com/img1.jpg',
    ]);

    return [$owner, $shop, $product, $media];
}

test('storefront product detail page provides video url pointing to media view route', function (): void {
    [, , $product, $media] = createProductWithVideoFixture();

    $response = $this->get(route('products.show', $product));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('product')
        ->where('product.video.url', route('media.view', $media))
        ->where('product.video.duration', 45)
    );
});

test('storefront product detail page omits video if scan status is not clean', function (string $scanStatus): void {
    [, , $product] = createProductWithVideoFixture(scanStatus: $scanStatus);

    $response = $this->get(route('products.show', $product));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('product')
        ->where('product.video', null)
    );
})->with(['pending', 'infected']);

test('admin moderation snapshot includes video url pointing to media view route', function (): void {
    [$owner, , $product, $media] = createProductWithVideoFixture();
    $admin = User::factory()->create(['role' => 'admin']);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'flagged_by_id' => $owner->id,
    ]);

    $result = app(ShowModerationItem::class)->handle($item);

    expect($result['preview']['snapshot']['video'])->not->toBeNull()
        ->and($result['preview']['snapshot']['video']['url'])->toBe(route('media.view', $media))
        ->and($result['preview']['snapshot']['video']['duration'])->toBe(45);
});
