<?php

declare(strict_types=1);

use App\Actions\Seller\CreateSellerProduct;
use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Models\Category;
use App\Models\HalalCertification;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

test('product with prohibited ingredient is automatically flagged on create', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $category = Category::factory()->create();

    $action = app(CreateSellerProduct::class);
    $product = $action->handle($shop, [
        'category_id' => $category->id,
        'name' => 'Tasty Snack',
        'price' => 15000,
        'stock' => 10,
        'ingredients' => 'Wheat flour, sugar, pork gelatin, salt.',
        'halal_status' => 'certified',
        'certifying_body' => 'IDCP',
    ]);

    $item = ModerationQueueItem::query()
        ->where('target_type', $product->getMorphClass())
        ->where('target_id', $product->id)
        ->where('reason_code', ModerationReason::ProhibitedIngredient->value)
        ->first();

    expect($item)->not->toBeNull()
        ->and($item->type)->toBe(ModerationItemType::Keyword)
        ->and($item->state)->toBe(ModerationState::Flagged);
});

test('product claiming halal in title without certificate is automatically flagged', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $category = Category::factory()->create();

    $action = app(CreateSellerProduct::class);
    $product = $action->handle($shop, [
        'category_id' => $category->id,
        'name' => 'Halal Beef Jerky',
        'price' => 20000,
        'stock' => 5,
        'halal_status' => 'na', // no certificate attached
    ]);

    $item = ModerationQueueItem::query()
        ->where('target_type', $product->getMorphClass())
        ->where('target_id', $product->id)
        ->where('reason_code', ModerationReason::HalalKeywordWithoutCertificate->value)
        ->first();

    expect($item)->not->toBeNull()
        ->and($item->type)->toBe(ModerationItemType::Keyword)
        ->and($item->state)->toBe(ModerationState::Flagged);
});

test('scheduled command flags expiring and expired certificates', function () {
    $product1 = Product::factory()->create();
    $product2 = Product::factory()->create();

    // Expiring in 10 days
    HalalCertification::factory()->create([
        'certifiable_type' => $product1->getMorphClass(),
        'certifiable_id' => $product1->id,
        'valid_until' => now()->addDays(10),
    ]);

    // Already expired 2 days ago
    HalalCertification::factory()->create([
        'certifiable_type' => $product2->getMorphClass(),
        'certifiable_id' => $product2->id,
        'valid_until' => now()->subDays(2),
    ]);

    Artisan::call('moderation:flag-expiring-certificates');

    $item1 = ModerationQueueItem::query()
        ->where('target_type', $product1->getMorphClass())
        ->where('target_id', $product1->id)
        ->where('reason_code', ModerationReason::HalalCertificateExpiring->value)
        ->first();

    $item2 = ModerationQueueItem::query()
        ->where('target_type', $product2->getMorphClass())
        ->where('target_id', $product2->id)
        ->where('reason_code', ModerationReason::HalalCertificateExpired->value)
        ->first();

    expect($item1)->not->toBeNull()
        ->and($item1->type)->toBe(ModerationItemType::Expiry)
        ->and($item2)->not->toBeNull()
        ->and($item2->type)->toBe(ModerationItemType::Expiry);
});

test('submitting a user report enqueues a moderation queue item', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)->postJson(route('reports.store'), [
        'target_type' => 'product',
        'target_id' => $product->id,
        'reason' => 'Misleading content',
        'details' => 'The product claims organic but is not certified.',
    ])->assertCreated();

    $report = Report::where('reporter_id', $user->id)->first();
    expect($report)->not->toBeNull();

    $item = ModerationQueueItem::query()
        ->where('target_type', $report->getMorphClass())
        ->where('target_id', $report->id)
        ->first();

    expect($item)->not->toBeNull()
        ->and($item->type)->toBe(ModerationItemType::Report)
        ->and($item->state)->toBe(ModerationState::Pending);
});
