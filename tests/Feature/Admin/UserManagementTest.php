<?php

declare(strict_types=1);

use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can list and search users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['name' => 'Aisha Rahman', 'email' => 'aisha@example.com']);
    User::factory()->create(['name' => 'Bob Cruz', 'email' => 'bob@example.com']);

    $response = $this->actingAs($admin)->get(route('admin.users.index', ['q' => 'aisha']));

    $response->assertOk();
    $users = $response->viewData('page')['props']['users'];
    expect(collect($users)->pluck('email'))->toContain('aisha@example.com')
        ->not->toContain('bob@example.com');
});

test('admin can filter users by suspension state', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $suspended = User::factory()->create(['suspended_at' => now()]);
    $active = User::factory()->create();

    $response = $this->actingAs($admin)->get(route('admin.users.index', ['suspended' => '1']));

    $users = $response->viewData('page')['props']['users'];
    expect(collect($users)->pluck('id'))->toContain($suspended->id)
        ->not->toContain($active->id);
});

test('admin can view a user detail page', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create();
    Shop::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($admin)->get(route('admin.users.show', $user));

    $response->assertOk();
    $shown = $response->viewData('page')['props']['user'];
    expect($shown['id'])->toBe($user->id)
        ->and($shown['shop'])->not->toBeNull();
});

test('admin can suspend and lift suspension on a user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create();

    $this->actingAs($admin)->post(route('admin.users.suspension.store', $user))->assertRedirect();
    expect($user->fresh()->isSuspended())->toBeTrue();
    $this->assertDatabaseHas('audit_logs', ['action' => 'user.suspended', 'subject_id' => $user->id]);

    $this->actingAs($admin)->delete(route('admin.users.suspension.destroy', $user))->assertRedirect();
    expect($user->fresh()->isSuspended())->toBeFalse();
    $this->assertDatabaseHas('audit_logs', ['action' => 'user.unsuspended', 'subject_id' => $user->id]);
});

test('admins cannot suspend themselves or other admins', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.users.suspension.store', $admin))->assertForbidden();
    $this->actingAs($admin)->post(route('admin.users.suspension.store', $other))->assertForbidden();

    expect($admin->fresh()->isSuspended())->toBeFalse()
        ->and($other->fresh()->isSuspended())->toBeFalse();
});

test('suspended users cannot log in', function () {
    $user = User::factory()->create(['suspended_at' => now()]);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('suspended users are logged out on their next request', function () {
    $user = User::factory()->create(['suspended_at' => now()]);

    $this->actingAs($user)->get(route('account.home'))->assertRedirect(route('login'));

    $this->assertGuest();
});

test('non-admin gets a not found response on user management routes', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)->get(route('admin.users.index'))->assertNotFound();
    $this->actingAs($user)->post(route('admin.users.suspension.store', $target))->assertNotFound();
});

test('admin can see shop staff association in user list and show', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id, 'name' => 'Al-Barakah Mart']);

    $staffUser = User::factory()->create(['email' => 'staffer@example.com']);
    ShopStaff::factory()->active()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser->id,
        'email' => $staffUser->email,
    ]);

    $listResponse = $this->actingAs($admin)->get(route('admin.users.index', ['q' => 'staffer']));
    $listResponse->assertOk();
    $users = $listResponse->viewData('page')['props']['users'];
    $staffRow = collect($users)->firstWhere('id', $staffUser->id);
    expect($staffRow['staff_at'])->not->toBeNull()
        ->and($staffRow['staff_at']['name'])->toBe('Al-Barakah Mart');

    $showResponse = $this->actingAs($admin)->get(route('admin.users.show', $staffUser));
    $showResponse->assertOk();
    $shown = $showResponse->viewData('page')['props']['user'];
    expect($shown['staff_at'])->not->toBeNull()
        ->and($shown['staff_at']['name'])->toBe('Al-Barakah Mart');
});
