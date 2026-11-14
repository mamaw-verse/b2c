<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Enums\MessageSenderRole;
use App\Enums\OrderStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Models\Voucher;
use App\Notifications\SellerOrderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function createShopWithStaff(): array
{
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $category = Category::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id, 'category_id' => $category->id]);

    $buyer = User::factory()->create();
    $order = Order::factory()->create(['shop_id' => $shop->id, 'user_id' => $buyer->id, 'status' => OrderStatus::ToShip]);
    OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
    ]);

    $conversation = Conversation::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
    ]);

    $voucher = Voucher::factory()->create([
        'shop_id' => $shop->id,
        'kind' => 'shop',
    ]);

    return compact('owner', 'shop', 'staff', 'category', 'product', 'buyer', 'order', 'conversation', 'voucher');
}

test('owner can access owner-only get routes', function (string $routeKey) {
    $data = createShopWithStaff();
    $url = match ($routeKey) {
        'finance' => '/seller/finance',
        'vouchers' => '/seller/vouchers',
        'settings' => '/seller/settings',
    };

    $this->actingAs($data['owner'])->get($url)->assertOk();
})->with([
    'finance',
    'vouchers',
    'settings',
]);

test('staff is denied with 404 from owner-only get routes', function (string $routeKey) {
    $data = createShopWithStaff();
    $url = match ($routeKey) {
        'finance' => '/seller/finance',
        'vouchers' => '/seller/vouchers',
        'settings' => '/seller/settings',
    };

    $this->actingAs($data['staff'])->get($url)->assertNotFound();
})->with([
    'finance',
    'vouchers',
    'settings',
]);

test('staff is denied with 404 from owner-only mutating routes', function () {
    $data = createShopWithStaff();
    $staff = $data['staff'];
    $voucher = $data['voucher'];

    // Vouchers store
    $this->actingAs($staff)->post('/seller/vouchers', [
        'code' => 'STAFF10',
        'name' => 'Staff voucher',
        'discount_type' => 'fixed',
        'discount_value' => 10,
        'min_spend' => 50,
        'total_usage_limit' => 100,
        'starts_at' => now()->toDateTimeString(),
        'expires_at' => now()->addDays(7)->toDateTimeString(),
    ])->assertNotFound();

    // Vouchers update
    $this->actingAs($staff)->put("/seller/vouchers/{$voucher->id}", [
        'name' => 'Updated by staff',
    ])->assertNotFound();

    // Vouchers destroy
    $this->actingAs($staff)->delete("/seller/vouchers/{$voucher->id}")->assertNotFound();

    // Payouts store
    $this->actingAs($staff)->post('/seller/payouts', [
        'amount' => 50000,
    ])->assertNotFound();

    // Payout account update
    $this->actingAs($staff)->put('/seller/payout-account', [
        'payout_method' => 'bank_transfer',
        'payout_account_name' => 'Staff Account',
        'payout_account_number' => '1234567890',
    ])->assertNotFound();

    // Settings update
    $this->actingAs($staff)->put('/seller/settings', [
        'name' => 'Renamed by staff',
    ])->assertNotFound();
});

test('staff and owner can access all operated get routes for their shop', function (string $routeKey) {
    $data = createShopWithStaff();
    $product = $data['product'];
    $order = $data['order'];
    $buyer = $data['buyer'];
    $conversation = $data['conversation'];

    $url = match ($routeKey) {
        'dashboard' => '/seller/dashboard',
        'products_index' => '/seller/products',
        'products_create' => '/seller/products/create',
        'products_edit' => "/seller/products/{$product->id}/edit",
        'orders_index' => '/seller/orders',
        'orders_show' => "/seller/orders/{$order->id}",
        'customers_index' => '/seller/customers',
        'customers_show' => "/seller/customers/{$buyer->id}",
        'chat_index' => '/seller/chat',
        'chat_show' => "/seller/chat/{$conversation->id}",
        'notifications_index' => '/seller/notifications',
    };

    // Both owner and staff can access
    $this->actingAs($data['owner'])->get($url)->assertOk();
    $this->actingAs($data['staff'])->get($url)->assertOk();
})->with([
    'dashboard',
    'products_index',
    'products_create',
    'products_edit',
    'orders_index',
    'orders_show',
    'customers_index',
    'customers_show',
    'chat_index',
    'chat_show',
    'notifications_index',
]);

test('staff cannot access operated routes belonging to another shop', function () {
    $data1 = createShopWithStaff();
    $data2 = createShopWithStaff();

    $staff1 = $data1['staff'];
    $product2 = $data2['product'];
    $order2 = $data2['order'];
    $conversation2 = $data2['conversation'];

    $this->actingAs($staff1)->get("/seller/products/{$product2->id}/edit")->assertNotFound();
    $this->actingAs($staff1)->get("/seller/orders/{$order2->id}")->assertNotFound();
    $this->actingAs($staff1)->get("/seller/chat/{$conversation2->id}")->assertNotFound();
});

test('staff cannot submit affiliate fields on product create or update', function () {
    $data = createShopWithStaff();
    $staff = $data['staff'];
    $product = $data['product'];
    $category = $data['category'];

    // Staff product create with affiliate_enabled fails with prohibited
    $this->actingAs($staff)->post('/seller/products', [
        'name' => 'Staff Product',
        'category_id' => $category->id,
        'description' => 'Staff product description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'affiliate_enabled' => true,
        'affiliate_commission_percent' => 5,
    ])->assertSessionHasErrors(['affiliate_enabled', 'affiliate_commission_percent']);

    // Staff product update with affiliate_enabled fails with prohibited
    $this->actingAs($staff)->put("/seller/products/{$product->id}", [
        'name' => 'Updated Staff Product',
        'affiliate_enabled' => true,
    ])->assertSessionHasErrors(['affiliate_enabled']);
});

test('owner can configure affiliate commission within limits and toggle keeps rate', function () {
    $data = createShopWithStaff();
    $owner = $data['owner'];
    $category = $data['category'];

    // Out of bounds rate (less than 1% or greater than 30%)
    $this->actingAs($owner)->post('/seller/products', [
        'name' => 'Affiliate Product Low',
        'category_id' => $category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'affiliate_enabled' => true,
        'affiliate_commission_percent' => 0.5, // Min is 1%
    ])->assertSessionHasErrors(['affiliate_commission_percent']);

    $this->actingAs($owner)->post('/seller/products', [
        'name' => 'Affiliate Product High',
        'category_id' => $category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'affiliate_enabled' => true,
        'affiliate_commission_percent' => 35, // Max is 30%
    ])->assertSessionHasErrors(['affiliate_commission_percent']);

    // Valid affiliate rate
    $this->actingAs($owner)->post('/seller/products', [
        'name' => 'Valid Affiliate Product',
        'category_id' => $category->id,
        'description' => 'Test description',
        'price' => 100,
        'stock' => 10,
        'weight' => 0.5,
        'affiliate_enabled' => true,
        'affiliate_commission_percent' => 7.5,
    ])->assertRedirect('/seller/products');

    $product = Product::where('name', 'Valid Affiliate Product')->firstOrFail();
    expect($product->affiliate_enabled)->toBeTrue()
        ->and($product->affiliate_commission_bps)->toBe(750);

    // Toggle off keeps the stored rate
    $this->actingAs($owner)->put("/seller/products/{$product->id}", [
        'name' => 'Valid Affiliate Product',
        'affiliate_enabled' => false,
    ])->assertRedirect('/seller/products');

    $product->refresh();
    expect($product->affiliate_enabled)->toBeFalse()
        ->and($product->affiliate_commission_bps)->toBe(750);
});

test('staff is blocked by guards from registering a shop, following their shop, or checking out own items', function () {
    $data = createShopWithStaff();
    $staff = $data['staff'];
    $shop = $data['shop'];
    $product = $data['product'];

    // 1. Staff cannot register a new shop
    $this->actingAs($staff)->post('/seller/register', [
        'shop_name' => 'Staff Rogue Shop',
        'description' => 'Trying to create second shop',
        'address_line' => '123 Test St',
        'city' => 'Manila',
        'state' => 'Metro Manila',
    ])->assertNotFound();

    // 2. Staff cannot follow their operated shop
    $this->actingAs($staff)->post("/shops/{$shop->slug}/follow")->assertNotFound();

    // 3. Staff cannot checkout items from their operated shop
    $cartItem = \App\Models\CartItem::factory()->create([
        'user_id' => $staff->id,
        'product_id' => $product->id,
        'selected' => true,
        'qty' => 1,
    ]);

    $address = \App\Models\Address::factory()->create(['user_id' => $staff->id]);
    $shipping = \App\Models\ShippingOption::factory()->create();

    $this->actingAs($staff)->post('/checkout', [
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
    ])->assertSessionHasErrors(['cart' => 'You cannot check out items from your own shop.']);
});

test('chat messages by staff have sender_role seller and order events notify all operators', function () {
    Notification::fake();

    $data = createShopWithStaff();
    $owner = $data['owner'];
    $staff = $data['staff'];
    $shop = $data['shop'];
    $conversation = $data['conversation'];
    $order = $data['order'];

    // Staff posts a message to buyer
    $this->actingAs($staff)->post("/seller/chat/{$conversation->id}/messages", [
        'body' => 'Hello from shop staff!',
    ])->assertRedirect();

    $message = Message::where('conversation_id', $conversation->id)->latest('id')->firstOrFail();
    expect($message->sender_role)->toBe(MessageSenderRole::Seller)
        ->and($message->sender_id)->toBe($staff->id);

    // Completing an order notifies both owner and staff
    $completeAction = app(\App\Actions\Order\CompleteOrder::class);
    $order->update(['status' => OrderStatus::ToReceive]);
    $completeAction->handle($order);

    Notification::assertSentTo([$owner, $staff], SellerOrderNotification::class);
});
