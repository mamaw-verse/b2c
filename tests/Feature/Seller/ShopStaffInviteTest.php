<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Enums\ShopStaffStatus;
use App\Models\AuditLog;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Notifications\ShopStaffInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

uses(RefreshDatabase::class);

test('owner can invite staff up to the cap of 2 and notification is sent', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    // Invite 1st staff
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'staff1@example.com',
    ])->assertRedirect()->assertSessionHas('success');

    expect($shop->staff()->count())->toBe(1);
    $staff1 = $shop->staff()->firstOrFail();
    expect($staff1->email)->toBe('staff1@example.com')
        ->and($staff1->status)->toBe(ShopStaffStatus::Pending)
        ->and($staff1->invited_by)->toBe($owner->id);

    Notification::assertSentTo(
        new \Illuminate\Notifications\AnonymousNotifiable,
        ShopStaffInvitationNotification::class,
        fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'staff1@example.com'
    );

    // Invite 2nd staff
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'staff2@example.com',
    ])->assertRedirect()->assertSessionHas('success');

    expect($shop->staff()->count())->toBe(2);

    // 3rd invite hits the cap
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'staff3@example.com',
    ])->assertSessionHasErrors(['email']);

    expect($shop->staff()->count())->toBe(2);

    $audit = AuditLog::where('action', 'shop.staff.invited')->get();
    expect($audit)->toHaveCount(2);
});

test('owner cannot invite themselves or an existing staff email', function () {
    $owner = User::factory()->create(['email' => 'owner@example.com']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    // Self invite
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'owner@example.com',
    ])->assertSessionHasErrors(['email']);

    // Case insensitive self invite
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'OWNER@EXAMPLE.COM',
    ])->assertSessionHasErrors(['email']);

    // Invite once
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'unique@example.com',
    ])->assertRedirect();

    // Invite duplicate
    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'unique@example.com',
    ])->assertSessionHasErrors(['email']);
});

test('cannot invite someone who is already a shop owner or active staff elsewhere', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    // Another shop owner
    $otherOwner = User::factory()->create(['email' => 'otherowner@example.com']);
    Shop::factory()->create(['user_id' => $otherOwner->id]);

    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'otherowner@example.com',
    ])->assertSessionHasErrors(['email']);

    // Another shop active staff
    $otherShop = Shop::factory()->create();
    $existingStaff = User::factory()->create(['email' => 'active_staff@example.com']);
    ShopStaff::factory()->create([
        'shop_id' => $otherShop->id,
        'user_id' => $existingStaff->id,
        'email' => $existingStaff->email,
        'status' => ShopStaffStatus::Active,
        'accepted_at' => now(),
    ]);

    $this->actingAs($owner)->post('/seller/staff', [
        'email' => 'active_staff@example.com',
    ])->assertSessionHasErrors(['email']);
});

test('invitee can view invitation with valid signed link and accept it', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $inviteeUser = User::factory()->create(['email' => 'invitee@example.com']);

    $staff = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'email' => 'invitee@example.com',
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
        'invited_at' => now(),
    ]);

    $validSignedUrl = URL::temporarySignedRoute(
        'staff-invitations.show',
        now()->addDays(7),
        ['staffInvitation' => $staff->id]
    );

    // Unsigned url returns 404
    $this->actingAs($inviteeUser)->get("/staff-invitations/{$staff->id}")
        ->assertNotFound();

    // Forged signature returns 404
    $this->actingAs($inviteeUser)->get("/staff-invitations/{$staff->id}?signature=invalid")
        ->assertNotFound();

    // Wrong user logged in returns 404
    $wrongUser = User::factory()->create(['email' => 'wrong@example.com']);
    $this->actingAs($wrongUser)->get($validSignedUrl)
        ->assertNotFound();

    // Correct user with valid signature views invitation
    $this->actingAs($inviteeUser)->get($validSignedUrl)
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('account/staff-invitation')
                ->where('invitation.shop_name', $shop->name)
                ->where('invitation.email', 'invitee@example.com')
        );

    // Accept invitation
    $this->actingAs($inviteeUser)->put("/staff-invitations/{$staff->id}")
        ->assertRedirect('/seller/dashboard');

    $staff->refresh();
    expect($staff->status)->toBe(ShopStaffStatus::Active)
        ->and($staff->user_id)->toBe($inviteeUser->id)
        ->and($staff->accepted_at)->not->toBeNull();

    expect(AuditLog::where('action', 'shop.staff.accepted')->exists())->toBeTrue();

    // Trying to view/accept again returns 404 because status is no longer Pending
    $this->actingAs($inviteeUser)->get($validSignedUrl)->assertNotFound();
    $this->actingAs($inviteeUser)->put("/staff-invitations/{$staff->id}")->assertNotFound();
});

test('expired invitation cannot be viewed or accepted', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $invitee = User::factory()->create(['email' => 'expired@example.com']);
    $staff = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'email' => 'expired@example.com',
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
        'invited_at' => now()->subDays(8),
    ]);

    $expiredSignedUrl = URL::temporarySignedRoute(
        'staff-invitations.show',
        now()->subDay(),
        ['staffInvitation' => $staff->id]
    );

    $this->actingAs($invitee)->get($expiredSignedUrl)->assertNotFound();
    $this->actingAs($invitee)->put("/staff-invitations/{$staff->id}")->assertNotFound();
});

test('invitee can decline invitation which deletes the row and frees the slot', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    // Fill 2 slots
    $invitee1 = User::factory()->create(['email' => 'decline1@example.com']);
    $staff1 = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'email' => 'decline1@example.com',
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
    ]);

    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'email' => 'other@example.com',
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
    ]);

    // Cap reached
    $this->actingAs($owner)->post('/seller/staff', ['email' => 'new@example.com'])
        ->assertSessionHasErrors(['email']);

    // Invitee 1 declines
    $this->actingAs($invitee1)->delete("/staff-invitations/{$staff1->id}")
        ->assertRedirect('/account');

    expect(ShopStaff::where('id', $staff1->id)->exists())->toBeFalse();

    // Now owner can invite again (slot freed)
    $this->actingAs($owner)->post('/seller/staff', ['email' => 'new@example.com'])
        ->assertRedirect();

    expect($shop->staff()->count())->toBe(2);
});

test('owner can remove staff and staff can leave', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staffUser1 = User::factory()->create();
    $staff1 = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser1->id,
        'email' => $staffUser1->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $staffUser2 = User::factory()->create();
    $staff2 = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser2->id,
        'email' => $staffUser2->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    // 1. Staff 2 leaves by deleting their own staff membership
    $this->actingAs($staffUser2)->delete("/seller/staff/{$staff2->id}")
        ->assertRedirect('/dashboard');

    expect(ShopStaff::where('id', $staff2->id)->exists())->toBeFalse();
    expect(AuditLog::where('action', 'shop.staff.left')->exists())->toBeTrue();

    // 2. Owner removes staff 1
    $this->actingAs($owner)->delete("/seller/staff/{$staff1->id}")
        ->assertRedirect();

    expect(ShopStaff::where('id', $staff1->id)->exists())->toBeFalse();
    expect(AuditLog::where('action', 'shop.staff.removed')->exists())->toBeTrue();

    // Both seats freed
    expect($shop->staff()->count())->toBe(0);
});
