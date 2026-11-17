<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Actions\Seller\GetSellerOrder;
use App\Enums\OrderStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Address;
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

beforeEach(function () {
    $this->owner = User::factory()->create(['name' => 'Owner Alice', 'email' => 'owner@example.com']);
    $this->shop = Shop::factory()->create(['user_id' => $this->owner->id]);

    $this->staff = User::factory()->create(['name' => 'Staff Bob', 'email' => 'staff@example.com']);
    ShopStaff::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->staff->id,
        'email' => $this->staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $this->owner->id,
        'accepted_at' => now(),
    ]);

    $this->buyer = User::factory()->create(['name' => 'Buyer Charlie', 'email' => 'buyer.secret@example.com']);
    $this->address = Address::factory()->create([
        'user_id' => $this->buyer->id,
        'phone' => '+639171234567',
        'street' => '123 Delivery St',
    ]);

    $this->category = Category::factory()->create();
    $this->product = Product::factory()->create(['shop_id' => $this->shop->id, 'category_id' => $this->category->id]);

    $this->order = Order::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
        'address_id' => $this->address->id,
        'status' => OrderStatus::ToShip,
        'subtotal' => 100_00,
        'total' => 100_00,
    ]);

    $this->orderItem = OrderItem::factory()->create([
        'order_id' => $this->order->id,
        'product_id' => $this->product->id,
        'unit_price' => 100_00,
        'qty' => 1,
        'subtotal' => 100_00,
    ]);

    $this->conversation = Conversation::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
    ]);
});

test('seller order payload does not contain buyer email for owner or staff', function () {
    $sellerOrder = app(GetSellerOrder::class)->handle($this->shop, $this->order);

    // Buyer sub-array must not have email
    expect($sellerOrder['buyer'])->not->toHaveKey('email');

    // Full JSON of order payload must not contain buyer's email
    $json = json_encode($sellerOrder);
    expect($json)->not->toContain('buyer.secret@example.com');

    // Phone appears only where delivery requires it (shipping address & delivery phone)
    expect($sellerOrder['shipping_address']['phone'])->toBe('+639171234567')
        ->and($sellerOrder['buyer']['phone'])->toBe('+639171234567');

    // Test through HTTP for both owner and staff
    foreach ([$this->owner, $this->staff] as $operator) {
        $response = $this->actingAs($operator)
            ->get(route('seller.orders.show', $this->order))
            ->assertOk();

        $content = $response->getContent();
        expect($content)->not->toContain('buyer.secret@example.com');
    }
});

test('seller chat payload does not contain buyer email for owner or staff', function () {
    Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->buyer->id,
        'sender_role' => 'buyer',
        'body' => 'Inquiry message',
    ]);

    foreach ([$this->owner, $this->staff] as $operator) {
        // Chat show
        $showResponse = $this->actingAs($operator)
            ->get(route('seller.chat.show', $this->conversation))
            ->assertOk();

        expect($showResponse->getContent())->not->toContain('buyer.secret@example.com');

        // Chat index
        $indexResponse = $this->actingAs($operator)
            ->get(route('seller.chat.index'))
            ->assertOk();

        expect($indexResponse->getContent())->not->toContain('buyer.secret@example.com');
    }
});

test('staff can read the customer pages of the shop they are working in', function () {
    $this->actingAs($this->staff)
        ->get(route('seller.customers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('seller/customers')->has('customers', 1));

    $this->actingAs($this->staff)
        ->get(route('seller.customers.show', $this->buyer))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('seller/customer')
                ->where('customer.id', $this->buyer->id)
        );
});

test('staff gets 404 for a customer who never ordered from their shop', function () {
    $stranger = User::factory()->create();

    $this->actingAs($this->staff)
        ->get(route('seller.customers.show', $stranger))
        ->assertNotFound();
});

test('owner can access ShowSellerCustomer which keeps existing GetSellerCustomer behaviour', function () {
    $this->actingAs($this->owner)
        ->get(route('seller.customers.show', $this->buyer))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('seller/customer')
                ->where('customer.id', $this->buyer->id)
                ->where('customer.email', $this->buyer->email)
                ->where('customer.phone_numbers.0', '+639171234567')
        );
});
