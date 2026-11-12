<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Enums\ReportStatus;
use App\Enums\ShopStatus;
use App\Models\HalalCertification;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can approve a product in halal review, transitioning it to certified and setting checked_at', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create([
        'halal_status' => HalalStatus::Review,
    ]);

    $cert = HalalCertification::factory()->create([
        'certifiable_type' => $product->getMorphClass(),
        'certifiable_id' => $product->id,
        'checked_at' => null,
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'type' => ModerationItemType::Halal->value,
        'state' => ModerationState::Pending->value,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'approved',
            'reason' => 'Certificate verified with IDCP database.',
        ]);

    $response->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Resolved)
        ->and($item->resolved_by)->toBe($admin->id)
        ->and($item->decision_reason)->toBe('Certificate verified with IDCP database.')
        ->and($item->resolved_at)->not->toBeNull();

    $event = ModerationEvent::where('moderation_queue_item_id', $item->id)->first();
    expect($event)->not->toBeNull()
        ->and($event->admin_id)->toBe($admin->id)
        ->and($event->action)->toBe('approved');

    $product->refresh();
    expect($product->halal_status)->toBe(HalalStatus::Certified);

    $cert->refresh();
    expect($cert->checked_at)->not->toBeNull();
});

test('admin can reject a moderation item with reason and audit event', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create([
        'halal_status' => HalalStatus::Review,
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'state' => ModerationState::Pending->value,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'rejected',
            'reason' => 'Invalid certificate number.',
        ]);

    $response->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Resolved)
        ->and($item->resolved_by)->toBe($admin->id);

    $product->refresh();
    expect($product->halal_status)->toBe(HalalStatus::Missing);

    $event = ModerationEvent::where('moderation_queue_item_id', $item->id)->first();
    expect($event->action)->toBe('rejected');
});

test('admin can hide a product target, marking it hidden and unpublished', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create([
        'published' => true,
        'hidden' => false,
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $product->getMorphClass(),
        'target_id' => $product->id,
        'state' => ModerationState::Flagged->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'hidden',
            'reason' => 'Contains pork derivatives.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Hidden);

    $product->refresh();
    expect($product->hidden)->toBeTrue()
        ->and($product->published)->toBeFalse();
});

test('admin can hide a review target', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $review = Review::factory()->create(['hidden' => false]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $review->getMorphClass(),
        'target_id' => $review->id,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'hidden',
            'reason' => 'Inappropriate language in review.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Hidden);

    $review->refresh();
    expect($review->hidden)->toBeTrue();
});

test('admin can suspend a shop target', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->create(['suspended' => false]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'state' => ModerationState::Flagged->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'suspended',
            'reason' => 'Repeated fraudulent claims.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Suspended);

    $shop->refresh();
    expect($shop->suspended)->toBeTrue();
});

test('admin decision on a report target updates report status and side-effects reportable', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create(['published' => true, 'hidden' => false]);
    $report = Report::factory()->create([
        'reportable_type' => $product->getMorphClass(),
        'reportable_id' => $product->id,
        'status' => ReportStatus::Pending,
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $report->getMorphClass(),
        'target_id' => $report->id,
        'type' => ModerationItemType::Report->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'hidden',
            'reason' => 'Confirmed violation from user report.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $report->refresh();
    expect($report->status)->toBe(ReportStatus::Actioned);

    $product->refresh();
    expect($product->hidden)->toBeTrue()
        ->and($product->published)->toBeFalse();
});

test('admin can request changes on a shop application, moving item to flagged and shop to changes_requested', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $applicant = User::factory()->create();
    $shop = Shop::factory()->pending()->create(['user_id' => $applicant->id]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'changes_requested',
            'reason' => 'Please provide a clearer business permit.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Flagged)
        ->and($item->reason_code)->toBe('changes_requested')
        ->and($item->decision_reason)->toBe('Please provide a clearer business permit.')
        ->and($item->resolved_at)->toBeNull();

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::ChangesRequested)
        ->and($shop->rejection_reason)->toBe('Please provide a clearer business permit.')
        ->and($shop->reviewed_at)->not->toBeNull()
        ->and($shop->reviewed_by)->toBe($admin->id);

    $event = ModerationEvent::where('moderation_queue_item_id', $item->id)->sole();
    expect($event->action)->toBe('changes_requested')
        ->and($event->reason)->toBe('Please provide a clearer business permit.');
});

test('admin can request certificate on a shop application, moving item to flagged and shop to changes_requested', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $applicant = User::factory()->create();
    $shop = Shop::factory()->pending()->create(['user_id' => $applicant->id]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'certificate_requested',
            'reason' => 'Please upload a valid halal certificate.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $item->refresh();
    expect($item->state)->toBe(ModerationState::Flagged)
        ->and($item->reason_code)->toBe('certificate_requested')
        ->and($item->decision_reason)->toBe('Please upload a valid halal certificate.')
        ->and($item->resolved_at)->toBeNull();

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::ChangesRequested)
        ->and($shop->rejection_reason)->toBe('Please upload a valid halal certificate.')
        ->and($shop->reviewed_at)->not->toBeNull()
        ->and($shop->reviewed_by)->toBe($admin->id);
});
