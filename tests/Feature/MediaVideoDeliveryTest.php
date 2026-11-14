<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStaffStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Media;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('marketplace.features.product_video_enabled', true);
    Storage::fake('s3');
});

/**
 * @return array{0: User, 1: Media, 2: Product}
 */
function createVideoDeliveryFixture(bool $published = true, string $scanStatus = 'clean', HalalStatus $halalStatus = HalalStatus::Certified): array
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
        'original_filename' => 'product.mp4',
        'extension' => 'mp4',
        'mime_type' => 'video/mp4',
        'storage_path' => 'media/product.mp4',
        'scan_status' => $scanStatus,
    ]);
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'published' => $published,
        'halal_status' => $halalStatus,
        'video_media_id' => $media->id,
    ]);

    return [$owner, $media, $product];
}

test('clean videos on marketplace-visible products redirect to a signed s3 temporary url', function (): void {
    [, $media] = createVideoDeliveryFixture();

    $response = $this->get(route('media.view', $media));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('product.mp4')
        ->and($response->headers->get('Cache-Control'))->toContain('private')->toContain('max-age=300');
});

test('videos are hidden with 404 when the product video feature is disabled', function (): void {
    [, $media] = createVideoDeliveryFixture();
    Config::set('marketplace.features.product_video_enabled', false);

    $this->get(route('media.view', $media))->assertNotFound();
});

test('pending or infected videos return 404', function (string $scanStatus): void {
    [, $media] = createVideoDeliveryFixture(scanStatus: $scanStatus);

    $this->get(route('media.view', $media))->assertNotFound();
})->with(['pending', 'infected']);

test('videos on non-visible products remain private to the product owner', function (): void {
    [$owner, $media] = createVideoDeliveryFixture(published: false);

    $this->get(route('media.view', $media))->assertForbidden();
    $this->actingAs($owner)->get(route('media.view', $media))->assertRedirect();
});

test('active staff can view their shop video while non-active staff cannot', function (): void {
    [$owner, $media, $product] = createVideoDeliveryFixture(published: false);
    $staff = User::factory()->create();
    $membership = ShopStaff::factory()->create([
        'shop_id' => $product->shop_id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
    ]);

    $this->actingAs($staff)->get(route('media.view', $media))->assertRedirect();

    $membership->update(['status' => ShopStaffStatus::Pending]);
    $this->actingAs($staff->fresh())->get(route('media.view', $media))->assertForbidden();
});

test('admins can access a clean video on an unpublished product', function (): void {
    [, $media] = createVideoDeliveryFixture(published: false);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->get(route('media.view', $media))->assertRedirect();
});
