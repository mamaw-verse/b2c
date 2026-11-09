<?php

declare(strict_types=1);

use App\Actions\Finance\ResolveCommissionRate;
use App\Models\Category;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can view platform settings with config fallbacks', function () {
    config(['marketplace.commission.default_bps' => 400, 'marketplace.payouts.minimum' => 50000]);
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('admin.settings.edit'));

    $response->assertOk();
    $settings = $response->viewData('page')['props']['settings'];
    expect($settings['commission_rate'])->toBe(4)
        ->and($settings['payout_minimum'])->toBe(500);
});

test('admin can update settings and overrides apply', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->put(route('admin.settings.update'), [
        'commission_rate' => 8,
        'auto_confirm_days' => 10,
        'return_window_days' => 14,
        'payout_hold_days' => 3,
        'payout_minimum' => 750,
        'announcement' => 'Ramadan sale is live',
    ])->assertRedirect(route('admin.settings.edit'));

    expect(Setting::find('marketplace.commission.default_bps')->value)->toBe(800)
        ->and(Setting::find('marketplace.payouts.minimum')->value)->toBe(75000)
        ->and(Setting::find('marketplace.announcement')->value)->toBe('Ramadan sale is live');

    $this->assertDatabaseHas('audit_logs', ['action' => 'settings.updated', 'actor_id' => $admin->id]);
});

test('setting overrides feed the commission resolver and shared props', function () {
    config(['marketplace.commission.default_bps' => 500]);
    Setting::create(['key' => 'marketplace.commission.default_bps', 'value' => 900]);
    Setting::create(['key' => 'marketplace.announcement', 'value' => 'Hello shoppers']);

    $category = Category::factory()->create(['commission_bps' => null]);
    expect(app(ResolveCommissionRate::class)->handle($category))->toBe(900);

    $admin = User::factory()->create(['role' => 'admin']);
    $response = $this->actingAs($admin)->get(route('admin.dashboard'));
    expect($response->viewData('page')['props']['marketplace']['announcement'])->toBe('Hello shoppers')
        ->and($response->viewData('page')['props']['marketplace']['commission']['default_bps'])->toBe(900);
});

test('settings validation rejects out of range values', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->put(route('admin.settings.update'), [
        'commission_rate' => 120,
        'auto_confirm_days' => 10,
        'return_window_days' => 14,
        'payout_hold_days' => 3,
        'payout_minimum' => 750,
    ])->assertSessionHasErrors('commission_rate');
});

test('non-admin gets a not found response on settings routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.settings.edit'))->assertNotFound();
    $this->actingAs($user)->put(route('admin.settings.update'), [])->assertNotFound();
});
