<?php

declare(strict_types=1);

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can list moderation queue items with default pending and flagged states', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $pending = ModerationQueueItem::factory()->create(['state' => ModerationState::Pending->value]);
    $flagged = ModerationQueueItem::factory()->create(['state' => ModerationState::Flagged->value]);
    $resolved = ModerationQueueItem::factory()->resolved()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.index'));

    $response->assertOk();
    $items = $response->viewData('page')['props']['queue']['data'];
    $ids = collect($items)->pluck('id');

    expect($ids)->toContain($pending->id)
        ->toContain($flagged->id)
        ->not->toContain($resolved->id);
});

test('admin can filter moderation queue by state', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $pending = ModerationQueueItem::factory()->create(['state' => ModerationState::Pending->value]);
    $resolved = ModerationQueueItem::factory()->resolved()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.index', ['state' => 'resolved']));

    $response->assertOk();
    $items = $response->viewData('page')['props']['queue']['data'];
    $ids = collect($items)->pluck('id');

    expect($ids)->toContain($resolved->id)
        ->not->toContain($pending->id);
});

test('admin can filter moderation queue by type', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $halal = ModerationQueueItem::factory()->create(['type' => ModerationItemType::Halal->value]);
    $keyword = ModerationQueueItem::factory()->create(['type' => ModerationItemType::Keyword->value]);

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.index', ['type' => 'halal']));

    $response->assertOk();
    $items = $response->viewData('page')['props']['queue']['data'];
    $ids = collect($items)->pluck('id');

    expect($ids)->toContain($halal->id)
        ->not->toContain($keyword->id);
});

test('admin can filter moderation queue by sla age', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $oldItem = ModerationQueueItem::factory()->create();
    $oldItem->created_at = now()->subDays(5);
    $oldItem->save();

    $newItem = ModerationQueueItem::factory()->create();
    $newItem->created_at = now();
    $newItem->save();

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.index', ['sla_days' => 3]));

    $response->assertOk();
    $items = $response->viewData('page')['props']['queue']['data'];
    $ids = collect($items)->pluck('id');

    expect($ids)->toContain($oldItem->id)
        ->not->toContain($newItem->id);
});

test('admin can view single moderation item with target and events loaded', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create();
    $item = ModerationQueueItem::factory()->forProduct($product)->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.show', $item));

    $response->assertOk();
    $pageItem = $response->viewData('page')['props']['item'];
    expect($pageItem['id'])->toBe($item->id)
        ->and($pageItem['target']['id'])->toBe($product->id);
});

test('admin can filter moderation queue by manual type and see live counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $manual = ModerationQueueItem::factory()->create(['type' => ModerationItemType::Manual->value, 'state' => ModerationState::Pending->value]);
    $halal = ModerationQueueItem::factory()->create(['type' => ModerationItemType::Halal->value, 'state' => ModerationState::Pending->value]);

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.index', ['type' => 'manual']));

    $response->assertOk();
    $items = $response->viewData('page')['props']['queue']['data'];
    $counts = $response->viewData('page')['props']['counts'];
    $ids = collect($items)->pluck('id');

    expect($ids)->toContain($manual->id)
        ->not->toContain($halal->id)
        ->and($counts['manual'] ?? 0)->toBeGreaterThanOrEqual(1);
});

test('admin detail view shows note and photos/video preview for manual flagged item', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create([
        'video_path' => 'product-videos/demo.mp4',
        'video_duration' => 25,
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'type' => ModerationItemType::Manual->value,
        'state' => ModerationState::Pending->value,
    ]);

    App\Models\ModerationEvent::create([
        'moderation_queue_item_id' => $item->id,
        'admin_id' => $admin->id,
        'action' => 'flagged',
        'reason' => 'Misleading packaging claim.',
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.moderation.show', $item));

    $response->assertOk();
    $preview = $response->viewData('page')['props']['preview'];
    expect($preview['kind'])->toBe('product')
        ->and($preview['snapshot']['note'])->toBe('Misleading packaging claim.')
        ->and($preview['snapshot']['video']['url'])->toContain('product-videos/demo.mp4')
        ->and($preview['snapshot']['video']['duration'])->toBe(25);
});
