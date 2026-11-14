<?php

declare(strict_types=1);

use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Models\AuditLog;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can flag a product manually with reason and note', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create([
        'name' => 'Questionable Item',
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.flags.store'), [
            'product_id' => $product->id,
            'reason' => ModerationReason::MisleadingContent->value,
            'note' => 'Misleading weight claim in title.',
        ]);

    $item = ModerationQueueItem::query()
        ->where('target_type', $product->getMorphClass())
        ->where('target_id', $product->id)
        ->first();

    expect($item)->not->toBeNull()
        ->and($item->type)->toBe(ModerationItemType::Manual)
        ->and($item->state)->toBe(ModerationState::Pending)
        ->and($item->reason_code)->toBe(ModerationReason::MisleadingContent->value)
        ->and($item->flagged_by_id)->toBe($admin->id);

    $response->assertRedirect(route('admin.moderation.show', $item));

    $event = ModerationEvent::query()
        ->where('moderation_queue_item_id', $item->id)
        ->first();

    expect($event)->not->toBeNull()
        ->and($event->admin_id)->toBe($admin->id)
        ->and($event->action)->toBe('flagged')
        ->and($event->reason)->toBe('Misleading weight claim in title.')
        ->and($event->meta['reason_code'])->toBe(ModerationReason::MisleadingContent->value)
        ->and($event->meta['note'])->toBe('Misleading weight claim in title.');

    $audit = AuditLog::query()
        ->where('actor_id', $admin->id)
        ->where('action', 'moderation.flagged')
        ->first();

    expect($audit)->not->toBeNull()
        ->and($audit->subject_id)->toBe($item->id)
        ->and($audit->metadata['product_id'])->toBe($product->id)
        ->and($audit->metadata['note'])->toBe('Misleading weight claim in title.');
});

test('manual flag dedupes when an open item already exists for that product', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create();

    $existing = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'type' => ModerationItemType::Report->value,
        'state' => ModerationState::Pending->value,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.flags.store'), [
            'product_id' => $product->id,
            'reason' => ModerationReason::CounterfeitGoods->value,
            'note' => 'Suspected fake.',
        ]);

    $response->assertRedirect(route('admin.moderation.show', $existing));

    expect(ModerationQueueItem::query()->where('target_id', $product->id)->count())->toBe(1);
});

test('non-admin cannot flag a product and receives 404', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $seller = User::factory()->create(['role' => 'seller']);
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $payload = [
        'product_id' => $product->id,
        'reason' => ModerationReason::Spam->value,
        'note' => 'Spam content.',
    ];

    $this->actingAs($buyer)
        ->post(route('admin.moderation.flags.store'), $payload)
        ->assertNotFound();

    $this->actingAs($seller)
        ->post(route('admin.moderation.flags.store'), $payload)
        ->assertNotFound();

    $this->post(route('admin.moderation.flags.store'), $payload)
        ->assertNotFound();
});

test('manual flag validates product, reason, and required note', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.flags.store'), [
            'product_id' => 'non-existent-id',
            'reason' => 'invalid_reason_code',
            'note' => '',
        ]);

    $response->assertSessionHasErrors(['product_id', 'reason', 'note']);
});

test('admin can search products by name, slug, or shop name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->create(['name' => 'Organic Valley']);

    $product1 = Product::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Artisan Honey Jar',
        'slug' => 'artisan-honey-jar',
    ]);

    $product2 = Product::factory()->create([
        'name' => 'Pure Vanilla Extract',
        'slug' => 'pure-vanilla-extract',
    ]);

    // Search by product name
    $res1 = $this->actingAs($admin)->getJson(route('admin.products.search', ['q' => 'honey']));
    $res1->assertOk()
        ->assertJsonCount(1, 'products')
        ->assertJsonPath('products.0.id', $product1->id);

    // Search by slug
    $res2 = $this->actingAs($admin)->getJson(route('admin.products.search', ['q' => 'vanilla-extract']));
    $res2->assertOk()
        ->assertJsonCount(1, 'products')
        ->assertJsonPath('products.0.id', $product2->id);

    // Search by shop name
    $res3 = $this->actingAs($admin)->getJson(route('admin.products.search', ['q' => 'Organic Valley']));
    $res3->assertOk()
        ->assertJsonCount(1, 'products')
        ->assertJsonPath('products.0.id', $product1->id);

    // Empty search
    $res4 = $this->actingAs($admin)->getJson(route('admin.products.search'));
    $res4->assertOk()
        ->assertExactJson(['products' => []]);
});

test('non-admin cannot search products via admin search endpoint', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->getJson(route('admin.products.search', ['q' => 'test']))
        ->assertNotFound();
});
