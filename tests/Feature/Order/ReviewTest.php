<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('user can submit review for a completed order item', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $product = Product::factory()->certified()->create();
    $order = Order::factory()->completed()->create(['user_id' => $user->id]);
    $item = OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
    ]);

    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 5,
        'body' => 'High quality halal dates, well packaged and fresh!',
        'anonymous' => true,
        'photos' => [$file],
    ]);

    $response->assertRedirect(route('orders.show', $order));

    $this->assertDatabaseHas('reviews', [
        'order_item_id' => $item->id,
        'user_id' => $user->id,
        'product_id' => $product->id,
        'rating' => 5,
        'body' => 'High quality halal dates, well packaged and fresh!',
        'anonymous' => true,
    ]);

    $review = Review::where('order_item_id', $item->id)->first();
    expect($review)->not->toBeNull();
    expect($review->photos)->toHaveCount(1);
    Storage::disk('public')->assertExists($review->photos->first()->path);
});

test('review requires a rating between 1 and 5', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->create(['user_id' => $user->id]);
    $item = OrderItem::factory()->create(['order_id' => $order->id]);

    $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 0,
        'body' => 'Too low rating',
    ])->assertSessionHasErrors('rating');

    $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 6,
        'body' => 'Too high rating',
    ])->assertSessionHasErrors('rating');
});

test('user cannot review items from an uncompleted order', function () {
    $user = User::factory()->create();
    $order = Order::factory()->toShip()->create(['user_id' => $user->id]);
    $item = OrderItem::factory()->create(['order_id' => $order->id]);

    $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 5,
        'body' => 'Too early',
    ])->assertNotFound();
});

test('user cannot review an item that belongs to another user order', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $order = Order::factory()->completed()->create(['user_id' => $otherUser->id]);
    $item = OrderItem::factory()->create(['order_id' => $order->id]);

    $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 5,
    ])->assertNotFound();
});

test('user cannot review the same order item twice', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->create(['user_id' => $user->id]);
    $item = OrderItem::factory()->create(['order_id' => $order->id]);

    Review::factory()->create([
        'order_item_id' => $item->id,
        'user_id' => $user->id,
        'product_id' => $item->product_id,
    ]);

    $this->actingAs($user)->post(route('reviews.store', $item), [
        'rating' => 4,
        'body' => 'Duplicate attempt',
    ])->assertSessionHasErrors('order_item');
});

test('reviews appear on product detail page', function () {
    $user = User::factory()->create(['name' => 'Ahmad Halal']);
    $product = Product::factory()->certified()->create();
    $order = Order::factory()->completed()->create(['user_id' => $user->id]);
    $item = OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'variation_label' => '500g Pack',
    ]);

    Review::factory()->create([
        'order_item_id' => $item->id,
        'user_id' => $user->id,
        'product_id' => $product->id,
        'rating' => 5,
        'body' => 'Super authentic and certified!',
        'anonymous' => false,
    ]);

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Partial-Component' => 'product',
        'X-Inertia-Partial-Data' => 'reviews',
    ])->get(route('products.show', $product));

    $response->assertOk();
    $response->assertJsonPath('component', 'product');
    $response->assertJsonPath('props.reviews.0.name', 'Ahmad Halal');
    $response->assertJsonPath('props.reviews.0.text', 'Super authentic and certified!');
    $response->assertJsonPath('props.reviews.0.variation', '500g Pack');
});
