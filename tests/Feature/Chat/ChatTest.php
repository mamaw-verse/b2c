<?php

declare(strict_types=1);

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest cannot access chat endpoints', function () {
    $this->get(route('chat.index'))->assertRedirect(route('login'));
    $this->post(route('chat.store'), ['shop_id' => 'abc'])->assertRedirect(route('login'));
});

test('buyer can list their conversations', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create();
    $conversation = Conversation::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $shop->user_id,
        'sender_role' => MessageSenderRole::Seller,
        'body' => 'Hello buyer!',
    ]);

    $response = $this->actingAs($user)->getJson(route('chat.index'));

    $response->assertOk()
        ->assertJsonCount(1, 'conversations')
        ->assertJsonPath('conversations.0.id', $conversation->id)
        ->assertJsonPath('conversations.0.unread_count', 1);
});

test('buyer can start conversation with shop', function () {
    $buyer = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->actingAs($buyer)->postJson(route('chat.store'), [
        'shop_id' => $shop->id,
        'initial_message' => 'Is this product available?',
        'product_id' => $product->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('conversation.shop_id', $shop->id);

    $this->assertDatabaseHas('conversations', [
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);

    $this->assertDatabaseHas('messages', [
        'sender_id' => $buyer->id,
        'type' => MessageType::Product->value,
        'product_id' => $product->id,
    ]);

    $this->assertDatabaseHas('messages', [
        'sender_id' => $buyer->id,
        'type' => MessageType::Text->value,
        'body' => 'Is this product available?',
    ]);
});

test('user cannot view another users conversation', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $shop = Shop::factory()->create();

    $conversation = Conversation::factory()->create([
        'user_id' => $userA->id,
        'shop_id' => $shop->id,
    ]);

    $this->actingAs($userB)
        ->get(route('chat.show', $conversation))
        ->assertNotFound();
});

test('buyer and seller can send messages in conversation', function () {
    $buyer = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $conversation = Conversation::factory()->create([
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);

    // Buyer sends message
    $response = $this->actingAs($buyer)->postJson(route('chat.messages.store', $conversation), [
        'body' => 'Hello seller!',
    ]);
    $response->assertCreated()
        ->assertJsonPath('message.sender_role', MessageSenderRole::Buyer->value);

    // Seller sends reply
    $replyResponse = $this->actingAs($seller)->postJson(route('chat.messages.store', $conversation), [
        'body' => 'Hello buyer, thanks for reaching out!',
    ]);
    $replyResponse->assertCreated()
        ->assertJsonPath('message.sender_role', MessageSenderRole::Seller->value);

    expect($conversation->messages()->count())->toBe(2);
});

test('viewing a conversation marks messages as read', function () {
    $buyer = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $conversation = Conversation::factory()->create([
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $seller->id,
        'sender_role' => MessageSenderRole::Seller,
        'read_at' => null,
    ]);

    expect($message->fresh()->read_at)->toBeNull();

    $this->actingAs($buyer)->get(route('chat.show', $conversation))->assertOk();

    expect($message->fresh()->read_at)->not->toBeNull();
});

test('explicit mark read endpoint updates read status', function () {
    $buyer = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $conversation = Conversation::factory()->create([
        'user_id' => $buyer->id,
        'shop_id' => $shop->id,
    ]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $seller->id,
        'sender_role' => MessageSenderRole::Seller,
        'read_at' => null,
    ]);

    $this->actingAs($buyer)->postJson(route('chat.read.store', $conversation))
        ->assertOk()
        ->assertJsonPath('updated_count', 1);

    expect($message->fresh()->read_at)->not->toBeNull();
});
