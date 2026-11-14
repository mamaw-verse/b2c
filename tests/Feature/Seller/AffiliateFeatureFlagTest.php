<?php

declare(strict_types=1);

use App\Actions\Account\ActivateAffiliateProfile;
use App\Enums\AffiliateProfileStatus;
use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('when affiliate flag is off (default), /account/affiliate returns 404', function () {
    expect(config('marketplace.affiliate.enabled'))->toBeFalse();

    $buyer = User::factory()->create();

    $this->actingAs($buyer)
        ->get(route('account.affiliate.index'))
        ->assertNotFound();

    $this->actingAs($buyer)
        ->post(route('account.affiliate.store'))
        ->assertNotFound();
});

test('when affiliate flag is off (default), no referral cookie is set by middleware', function () {
    expect(config('marketplace.affiliate.enabled'))->toBeFalse();

    $affiliateUser = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['user_id' => $affiliateUser->id]);

    $response = $this->get('/?ref='.$profile->code);
    $response->assertCookieMissing('affiliate_ref');
});

test('when affiliate flag is off (default), ActivateAffiliateProfile is inert and returns null', function () {
    expect(config('marketplace.affiliate.enabled'))->toBeFalse();

    $buyer = User::factory()->create();
    $action = app(ActivateAffiliateProfile::class);

    $profile = $action->handle($buyer);

    expect($profile)->toBeNull()
        ->and($buyer->refresh()->affiliateProfile)->toBeNull();
});

test('when affiliate flag is on, /account/affiliate returns 200 and can be activated', function () {
    config(['marketplace.affiliate.enabled' => true]);

    $buyer = User::factory()->create();

    $this->actingAs($buyer)
        ->get(route('account.affiliate.index'))
        ->assertOk();

    $this->actingAs($buyer)
        ->post(route('account.affiliate.store'))
        ->assertRedirect(route('account.affiliate.index'));

    expect($buyer->refresh()->affiliateProfile)->not->toBeNull();
});

test('when affiliate flag is on, referral cookie is captured by middleware', function () {
    config(['marketplace.affiliate.enabled' => true]);

    $affiliateUser = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['user_id' => $affiliateUser->id]);

    $response = $this->get('/?ref='.$profile->code);
    $response->assertCookie('affiliate_ref', $profile->code);
});

test('when affiliate flag is on, ActivateAffiliateProfile creates active profile', function () {
    config(['marketplace.affiliate.enabled' => true]);

    $buyer = User::factory()->create();
    $action = app(ActivateAffiliateProfile::class);

    $profile = $action->handle($buyer);

    expect($profile)->toBeInstanceOf(AffiliateProfile::class)
        ->and($profile->user_id)->toBe($buyer->id)
        ->and($profile->status)->toBe(AffiliateProfileStatus::Active)
        ->and($profile->code)->not->toBeEmpty();
});
