<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Actions\Chat\GetConversations;
use App\Actions\Chat\GetMessages;
use App\Actions\Order\GetOrder;
use App\Actions\Order\ResolveReturn;
use App\Actions\Seller\GetSellerOrder;
use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Enums\ShopStaffStatus;
use App\Enums\Workspace;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('owner sees staff name and is_staff true on staff messages, and is_staff false on owner messages in seller chat', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $conversation = Conversation::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
    ]);

    // Staff message
    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $staff->id,
        'sender_role' => MessageSenderRole::Seller,
        'type' => MessageType::Text,
        'body' => 'Hello from staff',
    ]);

    // Owner message
    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $owner->id,
        'sender_role' => MessageSenderRole::Seller,
        'type' => MessageType::Text,
        'body' => 'Hello from owner',
    ]);

    // Buyer message
    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $buyer->id,
        'sender_role' => MessageSenderRole::Buyer,
        'type' => MessageType::Text,
        'body' => 'Hello from buyer',
    ]);

    $getMessages = app(GetMessages::class);

    // In seller workspace: owner views messages
    $sellerMessages = $getMessages->handle($owner, $conversation, Workspace::Seller);

    expect($sellerMessages)->toHaveCount(3);

    $staffMsg = $sellerMessages->firstWhere('body', 'Hello from staff');
    expect($staffMsg->sender)->not->toBeNull()
        ->and($staffMsg->sender->id)->toBe($staff->id)
        ->and($staffMsg->sender->name)->toBe('Staff Bob')
        ->and($staffMsg->sender->is_staff)->toBeTrue();

    $ownerMsg = $sellerMessages->firstWhere('body', 'Hello from owner');
    expect($ownerMsg->sender)->not->toBeNull()
        ->and($ownerMsg->sender->id)->toBe($owner->id)
        ->and($ownerMsg->sender->name)->toBe('Owner Alice')
        ->and($ownerMsg->sender->is_staff)->toBeFalse();

    $buyerMsg = $sellerMessages->firstWhere('body', 'Hello from buyer');
    expect($buyerMsg->sender)->toBeNull();
});

test('owner sees staff sender in seller conversations latest message preview', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $conversation = Conversation::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'last_message_at' => now(),
    ]);

    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $staff->id,
        'sender_role' => MessageSenderRole::Seller,
        'type' => MessageType::Text,
        'body' => 'Latest message by staff',
    ]);

    $getConversations = app(GetConversations::class);
    $conversations = $getConversations->handle($owner, null, Workspace::Seller);

    expect($conversations)->toHaveCount(1);
    $latest = $conversations->first()->latestMessage;
    expect($latest)->not->toBeNull()
        ->and($latest->sender)->not->toBeNull()
        ->and($latest->sender->name)->toBe('Staff Bob')
        ->and($latest->sender->is_staff)->toBeTrue();
});

test('buyer payload has no staff identity in chat messages or conversation preview', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $conversation = Conversation::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'last_message_at' => now(),
    ]);

    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $staff->id,
        'sender_role' => MessageSenderRole::Seller,
        'type' => MessageType::Text,
        'body' => 'Secret staff message',
    ]);

    $getMessages = app(GetMessages::class);
    $buyerMessages = $getMessages->handle($buyer, $conversation, Workspace::Buyer);

    $msg = $buyerMessages->first();
    $serialized = $msg->toArray();

    // Assert sender is not in the serialized array, and sender_id is null
    expect($serialized)->not->toHaveKey('sender')
        ->and($msg->sender_id)->toBeNull();

    // Verify through HTTP response
    $this->actingAs($buyer)
        ->getJson("/account/chat/{$conversation->id}")
        ->assertOk()
        ->assertJsonMissing(['Staff Bob'])
        ->assertJsonMissing(['sender' => ['name' => 'Staff Bob']]);

    // Conversation preview in buyer inbox
    $getConversations = app(GetConversations::class);
    $buyerConversations = $getConversations->handle($buyer, null, Workspace::Buyer);

    $convSerialized = $buyerConversations->first()->toArray();
    expect($convSerialized['latest_message'])->not->toHaveKey('sender')
        ->and($convSerialized['latest_message']['sender_id'])->toBeNull();

    $this->actingAs($buyer)
        ->getJson('/account/chat')
        ->assertOk()
        ->assertJsonMissing(['Staff Bob']);
});

test('resolution of return (approval) shows staff name as resolved_by in seller order timeline', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $category = Category::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id, 'category_id' => $category->id]);

    $order = Order::factory()->returnRefund()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'subtotal' => 100_00,
        'voucher_discount' => 0,
    ]);

    $orderItem = OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'unit_price' => 100_00,
        'qty' => 1,
        'subtotal' => 100_00,
    ]);

    // Staff approves return
    app(ResolveReturn::class)->handle($staff, $order, 'approve', 'Approved by staff', [
        ['order_item_id' => $orderItem->id, 'qty' => 1],
    ]);

    // Owner checks seller order
    $sellerOrder = app(GetSellerOrder::class)->handle($shop, $order);
    $timeline = collect($sellerOrder['timeline']);

    $approvalEvent = $timeline->first(fn ($e) => str_contains(mb_strtolower($e['title']), 'refund approved'));
    expect($approvalEvent)->not->toBeNull()
        ->and($approvalEvent['resolved_by'])->toBe('Staff Bob');
});

test('resolution of return (decline) shows staff name as resolved_by in seller order timeline', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $order = Order::factory()->returnRefund()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
    ]);

    // Staff declines return
    app(ResolveReturn::class)->handle($staff, $order, 'decline', 'Not eligible for refund');

    // Owner checks seller order
    $sellerOrder = app(GetSellerOrder::class)->handle($shop, $order);
    $timeline = collect($sellerOrder['timeline']);

    $declinedEvent = $timeline->firstWhere('title', 'Return/refund declined');
    expect($declinedEvent)->not->toBeNull()
        ->and($declinedEvent['resolved_by'])->toBe('Staff Bob');
});

test('buyer order timeline has no staff identity on approved or declined return', function () {
    $owner = User::factory()->create(['name' => 'Owner Alice']);
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create(['name' => 'Staff Bob']);
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $buyer = User::factory()->create(['name' => 'Buyer Charlie']);
    $order = Order::factory()->returnRefund()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
    ]);

    app(ResolveReturn::class)->handle($staff, $order, 'decline', 'Item inspected and damaged');

    $buyerOrder = app(GetOrder::class)->handle($buyer, $order);
    $serialized = $buyerOrder->toArray();

    $json = json_encode($serialized);
    expect($json)->not->toContain('Staff Bob');
});
