<?php

declare(strict_types=1);

use App\Enums\LedgerEntryType;
use App\Models\AuditLog;
use App\Models\ModerationQueueItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can view the audit log', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    AuditLog::factory()->create(['actor_id' => $admin->id, 'action' => 'payout.paid']);

    $response = $this->actingAs($admin)->get(route('admin.audit-log.index'));

    $response->assertOk();
    $entries = $response->viewData('page')['props']['entries'];
    expect($entries)->toHaveCount(1)
        ->and($entries[0]['action'])->toBe('payout.paid');
});

test('audit log filters by action', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    AuditLog::factory()->create(['action' => 'payout.paid']);
    AuditLog::factory()->create(['action' => 'settings.updated']);

    $response = $this->actingAs($admin)->get(route('admin.audit-log.index', ['action' => 'payout.paid']));

    $entries = $response->viewData('page')['props']['entries'];
    expect($entries)->toHaveCount(1)
        ->and($entries[0]['action'])->toBe('payout.paid');
});

test('non-admin gets a not found response', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.audit-log.index'))->assertNotFound();
});

test('moderation decision writes an audit entry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = ModerationQueueItem::factory()->create();

    $this->actingAs($admin)->post(route('admin.moderation.decisions.store', $item), [
        'action' => 'approved',
        'reason' => 'Looks fine.',
    ])->assertRedirect();

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $admin->id,
        'action' => 'moderation.approved',
        'subject_id' => $item->id,
    ]);
});

test('payout resolution writes an audit entry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->create(['payout_method' => 'GCash', 'payout_account_name' => 'A', 'payout_account_number' => '0917']);
    $shop->ledgerEntries()->create(['type' => LedgerEntryType::Adjustment, 'amount' => 200000, 'available_at' => now()->subDay()]);
    $payout = app(App\Actions\Finance\RequestPayout::class)->handle($shop, 100000);

    $this->actingAs($admin)->put(route('admin.payouts.update', $payout), [
        'status' => 'paid',
        'reference' => 'REF-123',
    ])->assertRedirect();

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $admin->id,
        'action' => 'payout.paid',
        'subject_id' => $payout->id,
    ]);
});
