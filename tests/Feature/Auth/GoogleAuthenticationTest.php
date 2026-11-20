<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

function fakeGoogleUser(array $attributes = []): SocialiteUser
{
    return SocialiteUser::fake(array_merge([
        'id' => 'google-123',
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'given_name' => 'Jane',
        'family_name' => 'Doe',
        'verified_email' => true,
    ], $attributes));
}

test('guests can start Google authentication', function () {
    Socialite::fake('google');

    $this->get(route('auth.google.redirect'))->assertRedirect();
});

test('new users can register with a verified Google account', function () {
    Socialite::fake('google', fakeGoogleUser());

    $this->get(route('auth.google.callback'))->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'jane@example.com')->firstOrFail();

    expect($user->name)->toBe('Jane Doe')
        ->and($user->google_id)->toBe('google-123')
        ->and($user->password)->toBeNull()
        ->and($user->hasVerifiedEmail())->toBeTrue();
    $this->assertAuthenticatedAs($user);
});

test('a verified Google email is linked to an existing account without overwriting it', function () {
    $user = User::factory()->create([
        'name' => 'Existing Person',
        'email' => 'jane@example.com',
        'password' => Hash::make('existing-password'),
    ]);
    Socialite::fake('google', fakeGoogleUser(['name' => 'Changed Name']));

    $this->get(route('auth.google.callback'))->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->google_id)->toBe('google-123')
        ->and($user->name)->toBe('Existing Person')
        ->and(Hash::check('existing-password', $user->password))->toBeTrue();
    $this->assertAuthenticatedAs($user);
});

test('an email already linked to a different Google account is rejected', function () {
    User::factory()->create(['email' => 'jane@example.com', 'google_id' => 'someone-else']);
    Socialite::fake('google', fakeGoogleUser());

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('google');
    $this->assertGuest();
});

test('unverified Google emails are rejected', function () {
    Socialite::fake('google', fakeGoogleUser(['verified_email' => false]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('google');

    $this->assertGuest();
    expect(User::query()->count())->toBe(0);
});

test('suspended users cannot sign in with Google', function () {
    User::factory()->create([
        'email' => 'jane@example.com',
        'google_id' => 'google-123',
        'suspended_at' => now(),
    ]);
    Socialite::fake('google', fakeGoogleUser());

    $this->get(route('auth.google.callback'))->assertSessionHasErrors('google');
    $this->assertGuest();
});

test('Google-only accounts cannot log in with a password', function () {
    $user = User::factory()->create(['password' => null, 'google_id' => 'google-123']);

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'anything']);

    $this->assertGuest();
});

test('authenticated users cannot start the guest Google flow', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('auth.google.redirect'))
        ->assertRedirect();
});

test('a linked user can confirm their identity with Google', function () {
    $user = User::factory()->create(['google_id' => 'google-123']);
    Socialite::fake('google', fakeGoogleUser());

    $this->actingAs($user)
        ->get(route('auth.google.confirm.callback'))
        ->assertRedirect();

    expect(session()->has('auth.password_confirmed_at'))->toBeTrue();
});

test('confirming with a different Google account fails', function () {
    $user = User::factory()->create(['google_id' => 'google-123']);
    Socialite::fake('google', fakeGoogleUser(['id' => 'other']));

    $this->actingAs($user)
        ->get(route('auth.google.confirm.callback'))
        ->assertRedirect(route('password.confirm'))
        ->assertSessionHasErrors('google');
});

test('Google-only users can set a password without a current one', function () {
    $user = User::factory()->create(['password' => null, 'google_id' => 'google-123']);

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->put(route('user-password.update'), [
            'password' => 'N3w-Passw0rd!xyz',
            'password_confirmation' => 'N3w-Passw0rd!xyz',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->hasPassword())->toBeTrue();
});
