<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\GoogleAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the storefront includes the GA snippet when configured', function () {
    config(['services.google_analytics.measurement_id' => 'G-TEST123']);

    $this->get(route('home'))
        ->assertOk()
        ->assertSee('googletagmanager.com/gtag/js?id=G-TEST123', false);
});

test('the storefront omits the GA snippet when not configured', function () {
    config(['services.google_analytics.measurement_id' => null]);

    $this->get(route('home'))->assertOk()->assertDontSee('googletagmanager.com', false);
});

test('auth pages never include the GA snippet', function () {
    config(['services.google_analytics.measurement_id' => 'G-TEST123']);

    $this->get(route('login'))->assertOk()->assertDontSee('googletagmanager.com', false);
});

test('the analytics service reports unconfigured without credentials', function () {
    config([
        'services.google_analytics.property_id' => null,
        'services.google_analytics.credentials' => null,
    ]);

    $service = new GoogleAnalyticsService;

    expect($service->isConfigured())->toBeFalse()
        ->and($service->getOverview('2026-01-01', '2026-01-31'))->toBeNull();
});

test('the admin dashboard exposes whether analytics is configured', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('analyticsConfigured', false));
});
