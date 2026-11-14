<?php

declare(strict_types=1);

use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('owner access is unchanged and has owner role in seller props', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    expect($owner->ownsShop())->toBeTrue()
        ->and($owner->isSeller())->toBeTrue()
        ->and($owner->isShopStaff())->toBeFalse()
        ->and($owner->operatedShop()->id)->toBe($shop->id);

    $this->actingAs($owner)->get('/seller/dashboard')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->where('seller.role', 'owner')
                ->where('seller.shop_id', $shop->id)
        );
});

test('active staff gets access to seller workspace with staff role in seller props', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staffUser = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser->id,
        'email' => $staffUser->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    expect($staffUser->fresh()->ownsShop())->toBeFalse()
        ->and($staffUser->fresh()->isSeller())->toBeFalse()
        ->and($staffUser->fresh()->isShopStaff())->toBeTrue()
        ->and($staffUser->fresh()->operatedShop()?->id)->toBe($shop->id);

    $this->actingAs($staffUser)->get('/seller/dashboard')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->where('seller.role', 'staff')
                ->where('seller.shop_id', $shop->id)
        );
});

test('pending or removed staff cannot access the seller workspace', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $pendingUser = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $pendingUser->id,
        'email' => $pendingUser->email,
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
    ]);

    expect($pendingUser->ownsShop())->toBeFalse()
        ->and($pendingUser->isShopStaff())->toBeFalse()
        ->and($pendingUser->operatedShop())->toBeNull();

    $this->actingAs($pendingUser)->get('/seller/dashboard')
        ->assertRedirect(route('seller.register'));

    $userWithoutStaff = User::factory()->create();
    expect($userWithoutStaff->operatedShop())->toBeNull();
    $this->actingAs($userWithoutStaff)->get('/seller/dashboard')
        ->assertRedirect(route('seller.register'));
});

test('suspended or unapproved shop blocks staff access', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create([
        'user_id' => $owner->id,
        'suspended' => true,
    ]);

    $staffUser = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser->id,
        'email' => $staffUser->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    // Active staff on suspended shop is redirected to seller.suspended
    $this->actingAs($staffUser)->get('/seller/dashboard')
        ->assertRedirect(route('seller.suspended'));

    // Shop that is not approved blocks staff completely
    $pendingOwner = User::factory()->create();
    $pendingShop = Shop::factory()->pending()->create(['user_id' => $pendingOwner->id]);
    $pendingStaffUser = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $pendingShop->id,
        'user_id' => $pendingStaffUser->id,
        'email' => $pendingStaffUser->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $pendingOwner->id,
        'accepted_at' => now(),
    ]);

    expect($pendingStaffUser->fresh()->operatedShop())->toBeNull()
        ->and($pendingStaffUser->fresh()->isShopStaff())->toBeFalse();

    $this->actingAs($pendingStaffUser)->get('/seller/dashboard')
        ->assertRedirect(route('seller.register'));
});

test('shop isOperatedBy recognizes owner and active staff but not others', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $activeStaff = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $activeStaff->id,
        'email' => $activeStaff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $pendingStaff = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $pendingStaff->id,
        'email' => $pendingStaff->email,
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $owner->id,
    ]);

    $outsider = User::factory()->create();

    expect($shop->isOperatedBy($owner))->toBeTrue()
        ->and($shop->isOperatedBy($activeStaff))->toBeTrue()
        ->and($shop->isOperatedBy($pendingStaff))->toBeFalse()
        ->and($shop->isOperatedBy($outsider))->toBeFalse();
});

test('shop operators returns owner and all active staff without duplicates', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff1 = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff1->id,
        'email' => $staff1->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $staff2 = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff2->id,
        'email' => $staff2->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $operators = $shop->operators();
    expect($operators)->toHaveCount(3)
        ->and($operators->pluck('id')->all())->toEqualCanonicalizing([
            $owner->id,
            $staff1->id,
            $staff2->id,
        ]);
});
