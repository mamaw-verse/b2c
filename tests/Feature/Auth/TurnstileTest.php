<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\TurnstileVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

beforeEach(function () {
    // phpunit.xml disables the check globally; these tests exercise it.
    config(['humancheck.enabled' => true]);
});

test('login requires a turnstile token', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('cf-turnstile-response');
    $this->assertGuest();
});

test('login rejects an invalid turnstile token', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'cf-turnstile-response' => 'bad-token',
    ])->assertSessionHasErrors('cf-turnstile-response');
    $this->assertGuest();
});

test('login succeeds with a valid turnstile token', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'cf-turnstile-response' => 'valid-token',
    ]);

    $this->assertAuthenticatedAs($user);
});

test('registration requires a turnstile token', function () {
    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'new@example.com',
        'password' => 'N3w-Passw0rd!xyz',
        'password_confirmation' => 'N3w-Passw0rd!xyz',
    ])->assertSessionHasErrors('cf-turnstile-response');

    expect(User::query()->where('email', 'new@example.com')->exists())->toBeFalse();
});

test('password reset link requires a turnstile token', function () {
    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email])
        ->assertSessionHasErrors('cf-turnstile-response');

    $this->post(route('password.email'), [
        'email' => $user->email,
        'cf-turnstile-response' => 'valid-token',
    ])->assertSessionHasNoErrors();
});

test('human check issues an encrypted human pass cookie', function () {
    $this->postJson(route('human-check'), ['token' => 'valid-token'])
        ->assertOk()
        ->assertJsonPath('ok', true)
        ->assertCookie('human_pass');
});

test('human check rejects a bad token with a 422 envelope', function () {
    $this->postJson(route('human-check'), ['token' => 'nope'])
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'HUMAN_CHECK_FAILED');
});

test('human check requires a token', function () {
    $this->postJson(route('human-check'), [])->assertStatus(422);
});

test('verifier fails closed when cloudflare is unreachable', function () {
    Http::fake(['challenges.cloudflare.com/*' => Http::response([], 500)]);

    $result = app(TurnstileVerifier::class)->verify('token', '127.0.0.1');

    expect($result->success)->toBeFalse()
        ->and($result->errorCodes)->toBe(['http-error']);
});

test('verifier accepts a successful siteverify response', function () {
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true, 'hostname' => 'localhost'])]);

    expect(app(TurnstileVerifier::class)->verify('token')->success)->toBeTrue();
});

test('the human middleware blocks requests without a pass', function () {
    Route::middleware(['web', 'human'])->post('/_human-guarded', fn () => response()->json(['ok' => true]));

    $this->postJson('/_human-guarded')
        ->assertStatus(403)
        ->assertJsonPath('code', 'HUMAN_CHECK_REQUIRED');
});

test('the kill switch skips verification', function () {
    config(['humancheck.enabled' => false]);

    expect(app(TurnstileVerifier::class)->verify('anything')->success)->toBeTrue();
});
