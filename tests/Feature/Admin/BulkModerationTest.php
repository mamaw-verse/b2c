<?php

declare(strict_types=1);

use App\Enums\ModerationState;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can bulk hide items in the same state', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $p1 = Product::factory()->create(['published' => true, 'hidden' => false]);
    $p2 = Product::factory()->create(['published' => true, 'hidden' => false]);

    $item1 = ModerationQueueItem::factory()->create([
        'target_type' => $p1->getMorphClass(),
        'target_id' => $p1->id,
        'state' => ModerationState::Flagged->value,
    ]);

    $item2 = ModerationQueueItem::factory()->create([
        'target_type' => $p2->getMorphClass(),
        'target_id' => $p2->id,
        'state' => ModerationState::Flagged->value,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.bulk-decisions.store'), [
            'ids' => [$item1->id, $item2->id],
            'action' => 'hidden',
            'reason' => 'Bulk flagged items violation.',
        ]);

    $response->assertRedirect(route('admin.moderation.index'));

    $item1->refresh();
    $item2->refresh();

    expect($item1->state)->toBe(ModerationState::Hidden)
        ->and($item2->state)->toBe(ModerationState::Hidden)
        ->and($item1->resolved_by)->toBe($admin->id)
        ->and($item2->resolved_by)->toBe($admin->id);

    $p1->refresh();
    $p2->refresh();
    expect($p1->hidden)->toBeTrue()
        ->and($p2->hidden)->toBeTrue();

    expect(ModerationEvent::where('action', 'hidden')->count())->toBe(2);
});

test('bulk moderation fails validation when items are in different states', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $item1 = ModerationQueueItem::factory()->create([
        'state' => ModerationState::Pending->value,
    ]);

    $item2 = ModerationQueueItem::factory()->create([
        'state' => ModerationState::Flagged->value,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.bulk-decisions.store'), [
            'ids' => [$item1->id, $item2->id],
            'action' => 'approved',
            'reason' => 'Bulk approve',
        ]);

    $response->assertSessionHasErrors(['ids']);
});
