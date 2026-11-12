<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->customer = User::factory()->create();
    $this->address = Address::factory()->create([
        'user_id' => $this->customer->id,
        'phone' => '+639171234567',
        'street' => '123 Main St',
    ]);
    $this->order = Order::factory()->completed()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->customer->id,
        'address_id' => $this->address->id,
        'total' => 150_00,
    ]);
});

test('seller can view customer details for a customer with orders in their shop', function () {
    $response = $this->actingAs($this->seller)
        ->get(route('seller.customers.show', $this->customer));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('seller/customer')
        ->where('customer.id', $this->customer->id)
        ->where('customer.email', $this->customer->email)
        ->has('customer.orders', 1)
        ->where('customer.totals.orders', 1)
        ->where('customer.totals.total_spent', 150_00)
        ->has('customer.phone_numbers', 1)
    );
});

test('seller gets 404 for a customer with no orders in their shop', function () {
    $stranger = User::factory()->create();

    $this->actingAs($this->seller)
        ->get(route('seller.customers.show', $stranger))
        ->assertNotFound();
});

test('seller gets 404 for a customer whose orders were all cancelled', function () {
    $customerWithOnlyCancelled = User::factory()->create();
    Order::factory()->cancelled()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $customerWithOnlyCancelled->id,
    ]);

    $this->actingAs($this->seller)
        ->get(route('seller.customers.show', $customerWithOnlyCancelled))
        ->assertNotFound();
});

test('buyer cannot access seller customer page', function () {
    $this->actingAs($this->customer)
        ->get(route('seller.customers.show', $this->customer))
        ->assertRedirect(route('seller.register'));
});
