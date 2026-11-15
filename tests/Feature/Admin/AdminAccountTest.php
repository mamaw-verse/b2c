<?php

declare(strict_types=1);

use App\Models\User;
use App\Notifications\AdminAccessGrantedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('new email creates an admin, sends the notification, writes the audit log and sets email_verified_at', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.admins.store'), [
        'name' => 'Sarah Admin',
        'email' => 'sarah@example.com',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Admin access granted.');

    $newUser = User::query()->where('email', 'sarah@example.com')->first();
    expect($newUser)->not->toBeNull()
        ->and($newUser->role)->toBe('admin')
        ->and($newUser->name)->toBe('Sarah Admin')
        ->and($newUser->email_verified_at)->not->toBeNull();

    $this->assertDatabaseHas('audit_logs', [
        'action' => 'admin.granted',
        'actor_id' => $admin->id,
        'subject_type' => $newUser->getMorphClass(),
        'subject_id' => $newUser->id,
    ]);

    Notification::assertSentTo(
        $newUser,
        AdminAccessGrantedNotification::class,
        fn (AdminAccessGrantedNotification $notification) => $notification->isNewAccount === true
            && str_contains($notification->actionUrl, 'reset-password')
    );
});

test('existing buyer is not promoted without confirm_promote and is promoted with it', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $buyer = User::factory()->create([
        'name' => 'Alex Buyer',
        'email' => 'alex@example.com',
        'role' => 'buyer',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.admins.store'), [
        'email' => $buyer->email,
        'confirm_promote' => false,
    ]);

    $response->assertSessionHasErrors(['confirm_promote']);
    expect($buyer->fresh()->role)->toBe('buyer');
    Notification::assertNothingSent();

    $promoteResponse = $this->actingAs($admin)->post(route('admin.admins.store'), [
        'email' => $buyer->email,
        'confirm_promote' => true,
    ]);

    $promoteResponse->assertRedirect();
    $promoteResponse->assertSessionHas('success', 'Admin access granted.');

    expect($buyer->fresh()->role)->toBe('admin');

    $this->assertDatabaseHas('audit_logs', [
        'action' => 'admin.granted',
        'actor_id' => $admin->id,
        'subject_type' => $buyer->getMorphClass(),
        'subject_id' => $buyer->id,
    ]);

    Notification::assertSentTo(
        $buyer,
        AdminAccessGrantedNotification::class,
        fn (AdminAccessGrantedNotification $notification) => $notification->isNewAccount === false
            && str_contains($notification->actionUrl, 'login')
    );
});

test('suspended or existing-admin email is rejected', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $otherAdmin = User::factory()->create(['role' => 'admin', 'email' => 'otheradmin@example.com']);
    $suspendedUser = User::factory()->create([
        'role' => 'buyer',
        'email' => 'suspended@example.com',
        'suspended_at' => now(),
    ]);

    $adminResponse = $this->actingAs($admin)->post(route('admin.admins.store'), [
        'email' => $otherAdmin->email,
    ]);
    $adminResponse->assertSessionHasErrors('email');

    $suspendedResponse = $this->actingAs($admin)->post(route('admin.admins.store'), [
        'email' => $suspendedUser->email,
    ]);
    $suspendedResponse->assertSessionHasErrors('email');
});

test('non-admin gets a 404 on store and destroy', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $targetAdmin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($buyer)->post(route('admin.admins.store'), [
        'name' => 'Should Fail',
        'email' => 'fail@example.com',
    ])->assertNotFound();

    $this->actingAs($buyer)->delete(route('admin.admins.destroy', $targetAdmin))
        ->assertNotFound();
});

test('cannot revoke yourself or the last admin', function () {
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);

    // Cannot revoke yourself
    $this->actingAs($admin1)->delete(route('admin.admins.destroy', $admin1))
        ->assertForbidden();
    expect($admin1->fresh()->role)->toBe('admin');

    // Revoke admin2 so only admin1 remains
    $this->actingAs($admin1)->delete(route('admin.admins.destroy', $admin2))
        ->assertRedirect();
    expect($admin2->fresh()->role)->toBe('buyer');

    expect(User::query()->where('role', 'admin')->count())->toBe(1);

    // Cannot revoke the last remaining admin
    $this->actingAs($admin1)->delete(route('admin.admins.destroy', $admin1))
        ->assertForbidden();
    expect($admin1->fresh()->role)->toBe('admin');
});

test('revoke sets the role to buyer and writes the audit log', function () {
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin1)->delete(route('admin.admins.destroy', $admin2));

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Admin access revoked.');

    expect($admin2->fresh()->role)->toBe('buyer');

    $this->assertDatabaseHas('audit_logs', [
        'action' => 'admin.revoked',
        'actor_id' => $admin1->id,
        'subject_type' => $admin2->getMorphClass(),
        'subject_id' => $admin2->id,
    ]);
});

test('the throttle returns 429', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'admin']);

    for ($i = 0; $i < 10; $i++) {
        $this->actingAs($admin)->post(route('admin.admins.store'), [
            'name' => "Admin {$i}",
            'email' => "throttle{$i}@example.com",
        ])->assertRedirect();
    }

    $this->actingAs($admin)->post(route('admin.admins.store'), [
        'name' => 'Admin 11',
        'email' => 'throttle11@example.com',
    ])->assertStatus(429);
});
