<?php

declare(strict_types=1);

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guests are redirected to login when trying to follow or unfollow a shop', function () {
    $shop = Shop::factory()->create();

    $this->post(route('shops.follow.store', $shop))->assertRedirect(route('login'));
    $this->delete(route('shops.follow.destroy', $shop))->assertRedirect(route('login'));
});

test('buyer can follow a shop and followers_count increments', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $shop = Shop::factory()->create(['followers_count' => 0]);

    $response = $this->actingAs($buyer)
        ->from(route('shops.show', $shop))
        ->post(route('shops.follow.store', $shop));

    $response->assertRedirect(route('shops.show', $shop));

    $shop->refresh();
    expect($shop->followers_count)->toBe(1)
        ->and($buyer->followedShops()->whereKey($shop->id)->exists())->toBeTrue();
});

test('following a shop is idempotent', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $shop = Shop::factory()->create(['followers_count' => 0]);

    $this->actingAs($buyer)->post(route('shops.follow.store', $shop));
    $this->actingAs($buyer)->post(route('shops.follow.store', $shop));

    $shop->refresh();
    expect($shop->followers_count)->toBe(1)
        ->and($shop->followers()->count())->toBe(1);
});

test('buyer can unfollow a shop and followers_count decrements', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $shop = Shop::factory()->create();
    $shop->followers()->attach($buyer->id);
    $shop->update(['followers_count' => 1]);

    $response = $this->actingAs($buyer)
        ->from(route('shops.show', $shop))
        ->delete(route('shops.follow.destroy', $shop));

    $response->assertRedirect(route('shops.show', $shop));

    $shop->refresh();
    expect($shop->followers_count)->toBe(0)
        ->and($buyer->followedShops()->whereKey($shop->id)->exists())->toBeFalse();
});

test('unfollowing a shop is idempotent', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $shop = Shop::factory()->create(['followers_count' => 0]);

    $this->actingAs($buyer)->delete(route('shops.follow.destroy', $shop));

    $shop->refresh();
    expect($shop->followers_count)->toBe(0);
});

test('shop owner receives 404 when trying to follow their own shop', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)
        ->post(route('shops.follow.store', $shop))
        ->assertNotFound();

    $this->actingAs($owner)
        ->delete(route('shops.follow.destroy', $shop))
        ->assertNotFound();
});

test('shop page reflects is_following status', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    $shop = Shop::factory()->create();

    $this->actingAs($buyer)
        ->get(route('shops.show', $shop))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shop')
            ->where('shop.is_following', false)
        );

    $shop->followers()->attach($buyer->id);

    $this->actingAs($buyer)
        ->get(route('shops.show', $shop))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shop')
            ->where('shop.is_following', true)
        );
});
