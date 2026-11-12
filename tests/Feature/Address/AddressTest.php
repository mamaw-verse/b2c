<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;
use App\Models\Region;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can create an address and first address becomes default', function () {
    $user = User::factory()->create();
    $region = Region::factory()->create();
    $province = Province::factory()->create(['region_code' => $region->code]);
    $city = City::factory()->create(['province_code' => $province->code]);
    $barangay = Barangay::factory()->create(['city_code' => $city->code]);

    $this->actingAs($user)
        ->from(route('addresses.index'))
        ->post(route('addresses.store'), [
            'name' => 'Maria Santos',
            'phone' => '09171234567',
            'region_code' => $region->code,
            'province_code' => $province->code,
            'city_code' => $city->code,
            'barangay_code' => $barangay->code,
            'street' => '123 Rizal Ave',
            'postal_code' => '1000',
            'label' => 'home',
        ])
        ->assertRedirect(route('addresses.index'));

    $address = Address::where('user_id', $user->id)->first();
    expect($address)->not->toBeNull()
        ->and($address->phone)->toBe('+639171234567')
        ->and($address->is_default)->toBeTrue();
});

test('setting default address unsets other defaults', function () {
    $user = User::factory()->create();
    $addr1 = Address::factory()->create(['user_id' => $user->id, 'is_default' => true]);
    $addr2 = Address::factory()->create(['user_id' => $user->id, 'is_default' => false]);

    $this->actingAs($user)
        ->from(route('addresses.index'))
        ->put(route('addresses.default.update', $addr2))
        ->assertRedirect(route('addresses.index'));

    expect($addr1->fresh()->is_default)->toBeFalse()
        ->and($addr2->fresh()->is_default)->toBeTrue();
});

test('user cannot update or delete another users address', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user1->id]);

    $this->actingAs($user2)
        ->put(route('addresses.update', $address), [
            'name' => 'Hacker Name',
        ])
        ->assertNotFound();

    $this->actingAs($user2)
        ->delete(route('addresses.destroy', $address))
        ->assertNotFound();
});

test('admin user can create an address and redirects back', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $region = Region::factory()->create();
    $province = Province::factory()->create(['region_code' => $region->code]);
    $city = City::factory()->create(['province_code' => $province->code]);
    $barangay = Barangay::factory()->create(['city_code' => $city->code]);

    $response = $this->actingAs($admin)
        ->from(route('checkout.show'))
        ->post(route('addresses.store'), [
            'name' => 'Admin Buyer',
            'phone' => '09171234567',
            'region_code' => $region->code,
            'province_code' => $province->code,
            'city_code' => $city->code,
            'barangay_code' => $barangay->code,
            'street' => '456 Admin St',
            'postal_code' => '1000',
            'label' => 'work',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('checkout.show'));

    $address = Address::where('user_id', $admin->id)->first();
    expect($address)->not->toBeNull()
        ->and($address->name)->toBe('Admin Buyer')
        ->and($address->phone)->toBe('+639171234567');
});
