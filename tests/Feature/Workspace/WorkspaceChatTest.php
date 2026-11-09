<?php

declare(strict_types=1);

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the buyer inbox only lists conversations where the user is the buyer', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();

    // The seller's own purchase conversation with another shop.
    $otherShop = Shop::factory()->create();
    Conversation::factory()->create(['user_id' => $seller->id, 'shop_id' => $otherShop->id]);
    // A buyer's conversation with the seller's shop.
    Conversation::factory()->create(['user_id' => $buyer->id, 'shop_id' => $shop->id]);

    $this->actingAs($seller)->getJson('/account/chat')
        ->assertOk()
        ->assertJsonCount(1, 'conversations')
        ->assertJsonPath('conversations.0.shop_id', $otherShop->id);

    $this->actingAs($seller)->getJson('/seller/chat')
        ->assertOk()
        ->assertJsonCount(1, 'conversations')
        ->assertJsonPath('conversations.0.shop_id', $shop->id);
});

test('a conversation cannot be opened in the wrong workspace', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();
    $conversation = Conversation::factory()->create([
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);

    // The shop owner cannot open the buyer side of the thread.
    $this->actingAs($seller)->get("/account/chat/{$conversation->id}")->assertNotFound();

    // A buyer with no shop is sent to the application flow, and a seller
    // who does not own the conversation's shop gets a 404.
    $otherSeller = User::factory()->create();
    Shop::factory()->create(['user_id' => $otherSeller->id]);
    $this->actingAs($buyer)->get("/seller/chat/{$conversation->id}")->assertRedirect(route('seller.register'));
    $this->actingAs($otherSeller)->get("/seller/chat/{$conversation->id}")->assertNotFound();

    // Both parties reach their own side.
    $this->actingAs($buyer)->get("/account/chat/{$conversation->id}")->assertOk();
    $this->actingAs($seller)->get("/seller/chat/{$conversation->id}")->assertOk();
});

test('unread chat counts are scoped per workspace', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();
    $conversation = Conversation::factory()->create([
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);
    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $buyer->id,
        'sender_role' => 'buyer',
        'read_at' => null,
    ]);

    // The seller's own purchase also gets an unread reply.
    $otherShop = Shop::factory()->create();
    $ownChat = Conversation::factory()->create(['user_id' => $seller->id, 'shop_id' => $otherShop->id]);
    Message::factory()->create([
        'conversation_id' => $ownChat->id,
        'sender_id' => null,
        'sender_role' => 'seller',
        'read_at' => null,
    ]);

    // Buyer workspace: only the seller's own conversation counts.
    $this->actingAs($seller)->get('/account/chat')
        ->assertInertia(fn ($page) => $page->where('unreadCounts.chat', 1));

    // Seller workspace: only conversations to the shop count.
    $this->actingAs($seller)->get('/seller/chat')
        ->assertInertia(fn ($page) => $page->where('unreadCounts.chat', 1));

    // The buyer sees the seller-side reply nowhere in their buyer inbox.
    $this->actingAs($buyer)->get('/account/chat')
        ->assertInertia(fn ($page) => $page->where('unreadCounts.chat', 0));
});

test('notification lists are scoped per workspace', function () {
    $seller = User::factory()->create();
    Shop::factory()->create(['user_id' => $seller->id]);

    $seller->notify(new App\Notifications\OrderStatusNotification(
        App\Models\Order::factory()->create(['user_id' => $seller->id]),
        'Order update',
        'Your parcel moved.',
    ));

    $this->actingAs($seller)->getJson('/account/notifications')
        ->assertOk()
        ->assertJsonCount(1, 'notifications');

    $this->actingAs($seller)->getJson('/seller/notifications')
        ->assertOk()
        ->assertJsonCount(0, 'notifications');
});
