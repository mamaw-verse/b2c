<?php

declare(strict_types=1);

use App\Models\ModerationQueueItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to login for admin dashboard', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('non-admin users receive 404 for admin dashboard', function () {
    $user = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertNotFound();
});

test('seller users receive 404 for admin routes', function () {
    $seller = User::factory()->create();
    $item = ModerationQueueItem::factory()->create();

    $this->actingAs($seller)
        ->get(route('admin.moderation.index'))
        ->assertNotFound();

    $this->actingAs($seller)
        ->get(route('admin.moderation.show', $item))
        ->assertNotFound();

    $this->actingAs($seller)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'approved',
            'reason' => 'test',
        ])
        ->assertNotFound();

    $this->actingAs($seller)
        ->post(route('admin.moderation.bulk-decisions.store'), [
            'ids' => [$item->id],
            'action' => 'approved',
            'reason' => 'test',
        ])
        ->assertNotFound();
});

test('admin users can access admin routes', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = ModerationQueueItem::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.moderation.index'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.moderation.show', $item))
        ->assertOk();
});
