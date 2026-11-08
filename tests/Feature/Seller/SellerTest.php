<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create(['role' => 'seller']);
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
        'name' => 'Barakah Pantry',
        'slug' => 'barakah-pantry-'.Str::random(6),
    ]);

    $this->buyerUser = User::factory()->create(['role' => 'buyer']);
    $this->otherSellerUser = User::factory()->create(['role' => 'seller']);
    $this->otherShop = Shop::factory()->create([
        'user_id' => $this->otherSellerUser->id,
        'name' => 'Other Shop',
        'slug' => 'other-shop-'.Str::random(6),
    ]);

    $this->category = Category::first() ?? Category::create([
        'name' => 'Halal Food',
        'slug' => 'halal-food',
        'icon' => 'utensils',
        'sort_order' => 1,
    ]);
});

test('guests are redirected to login when accessing seller pages', function () {
    $this->get(route('seller.dashboard'))->assertRedirect(route('login'));
    $this->get(route('seller.products.index'))->assertRedirect(route('login'));
    $this->get(route('seller.orders.index'))->assertRedirect(route('login'));
    $this->get(route('seller.settings.edit'))->assertRedirect(route('login'));
});

test('buyers without a shop are denied access with 404', function () {
    $this->actingAs($this->buyerUser)
        ->get(route('seller.dashboard'))
        ->assertNotFound();

    $this->actingAs($this->buyerUser)
        ->get(route('seller.products.index'))
        ->assertNotFound();

    $this->actingAs($this->buyerUser)
        ->get(route('seller.orders.index'))
        ->assertNotFound();

    $this->actingAs($this->buyerUser)
        ->get(route('seller.settings.edit'))
        ->assertNotFound();
});

test('seller can view dashboard with tasks, metrics, and chart data', function () {
    $this->actingAs($this->sellerUser)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/dashboard')
            ->has('shop')
            ->has('tasks')
            ->has('metrics')
            ->has('sales_chart')
            ->has('sales_chart.data', 7)
            ->has('recent_orders')
            ->where('metrics.0.label', 'Sales today')
            ->where('metrics.1.label', 'Orders today')
            ->where('metrics.2.label', 'Avg. order value')
        );
});

test('dashboard displays halal certificate expiry signal when certificate expires within 30 days', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'halal_status' => HalalStatus::Certified,
    ]);

    $product->halalCertifications()->create([
        'certifying_body' => 'Islamic Da’wah Council of the Philippines (IDCP)',
        'number' => 'HC-2026-00481',
        'scope' => 'Food items',
        'valid_until' => now()->addDays(7),
    ]);

    $this->actingAs($this->sellerUser)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/dashboard')
            ->where('expiry_warning.days_left', 7)
            ->where('expiry_warning.is_expired', false)
            ->where('expiry_warning.certifying_body', 'Islamic Da’wah Council of the Philippines (IDCP)')
            ->where('expiry_warning.product', $product->name)
            ->where('expiry_warning.edit_url', route('seller.products.edit', $product))
        );
});

test('dashboard metrics and sales chart use real order totals', function () {
    $address = Address::factory()->create(['user_id' => $this->sellerUser->id]);
    $shipping = ShippingOption::first() ?? ShippingOption::create([
        'name' => 'Standard Delivery',
        'fee' => 8000,
    ]);

    Order::create([
        'user_id' => $this->buyerUser->id,
        'shop_id' => $this->shop->id,
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
        'status' => OrderStatus::ToShip,
        'subtotal' => 100000,
        'shipping_fee' => 8000,
        'total' => 108000,
    ]);

    $this->actingAs($this->sellerUser)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.0.value', '₱1,080')
            ->where('metrics.1.value', '1')
            ->where('metrics.2.value', '₱1,080')
            ->where('sales_chart.data.6.1', 108000)
        );
});

test('seller can view products list with filters', function () {
    Product::factory()->count(3)->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
    ]);

    $this->actingAs($this->sellerUser)
        ->get(route('seller.products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/index')
            ->has('products.data', 3)
            ->has('categories')
        );
});

test('seller can create a certified halal product with variations and declaration', function () {
    $payload = [
        'name' => 'Premium Ajwa Dates 500g',
        'category_id' => $this->category->id,
        'description' => 'Premium fresh Ajwa dates imported from Madinah. Resealable pack.',
        'halal_status' => 'certified',
        'certifying_body' => 'Islamic Da’wah Council of the Philippines (IDCP)',
        'certificate_number' => 'HC-2026-00481',
        'valid_until' => now()->addYears(2)->toDateString(),
        'ingredients' => '100% Ajwa dates',
        'no_pork_alcohol_declared' => true,
        'weight' => 0.5,
        'length' => 10,
        'width' => 10,
        'height' => 15,
        'published' => true,
        'option1_name' => 'Grade',
        'option2_name' => 'Weight',
        'variations' => [
            [
                'option1_value' => 'Premium',
                'option2_value' => '250g',
                'price' => 349,
                'stock' => 20,
                'sku' => 'DTS-PR-250G',
            ],
            [
                'option1_value' => 'Premium',
                'option2_value' => '500g',
                'price' => 649,
                'stock' => 42,
                'sku' => 'DTS-PR-500G',
            ],
        ],
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertRedirect(route('seller.products.index'));

    $this->assertDatabaseHas('products', [
        'shop_id' => $this->shop->id,
        'name' => 'Premium Ajwa Dates 500g',
        'no_pork_alcohol_declared' => true,
        'stock' => 62, // 20 + 42
    ]);

    $product = Product::where('shop_id', $this->shop->id)->where('name', 'Premium Ajwa Dates 500g')->first();
    expect($product->variations()->count())->toBe(2);
    expect($product->halalCertifications()->count())->toBe(1);
    expect($product->halalCertifications()->first()->certifying_body)->toBe('Islamic Da’wah Council of the Philippines (IDCP)');
});

test('creating halal product fails validation without required certificate fields and declaration', function () {
    $payload = [
        'name' => 'Ajwa Dates',
        'category_id' => $this->category->id,
        'description' => 'Dates description',
        'halal_status' => 'certified',
        // Missing certifying_body, certificate_number, valid_until, ingredients, no_pork_alcohol_declared
        'weight' => 0.5,
        'price' => 300,
        'stock' => 10,
    ];

    $response = $this->actingAs($this->sellerUser)
        ->post(route('seller.products.store'), $payload);

    $response->assertSessionHasErrors([
        'certifying_body',
        'certificate_number',
        'valid_until',
        'ingredients',
        'no_pork_alcohol_declared',
    ]);
});

test('seller cannot edit or update or delete another shops product', function () {
    $otherProduct = Product::factory()->create([
        'shop_id' => $this->otherShop->id,
        'category_id' => $this->category->id,
    ]);

    $this->actingAs($this->sellerUser)
        ->get(route('seller.products.edit', $otherProduct))
        ->assertNotFound();

    $this->actingAs($this->sellerUser)
        ->put(route('seller.products.update', $otherProduct), ['name' => 'Hacked'])
        ->assertNotFound();

    $this->actingAs($this->sellerUser)
        ->delete(route('seller.products.destroy', $otherProduct))
        ->assertNotFound();
});

test('seller can update product and delete product', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Original Name',
        'price' => 20000,
        'stock' => 15,
        'weight' => 1.0,
    ]);

    $this->actingAs($this->sellerUser)
        ->put(route('seller.products.update', $product), [
            'name' => 'Updated Name',
            'category_id' => $this->category->id,
            'description' => 'Updated Description',
            'price' => 250,
            'stock' => 30,
            'weight' => 1.2,
        ])
        ->assertRedirect(route('seller.products.index'));

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Updated Name',
        'price' => 25000,
        'stock' => 30,
    ]);

    $this->actingAs($this->sellerUser)
        ->delete(route('seller.products.destroy', $product))
        ->assertRedirect(route('seller.products.index'));

    $this->assertDatabaseMissing('products', ['id' => $product->id]);
});

test('seller can list and view their orders', function () {
    $address = Address::factory()->create(['user_id' => $this->sellerUser->id]);

    $shipping = ShippingOption::first() ?? ShippingOption::create([
        'name' => 'Standard Delivery',
        'fee' => 8000,
    ]);

    $order = Order::create([
        'user_id' => $this->buyerUser->id,
        'shop_id' => $this->shop->id,
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
        'status' => OrderStatus::ToShip,
        'subtotal' => 100000,
        'shipping_fee' => 8000,
        'total' => 108000,
    ]);

    $product = Product::factory()->create(['shop_id' => $this->shop->id, 'category_id' => $this->category->id]);

    OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'unit_price' => 100000,
        'qty' => 1,
        'subtotal' => 100000,
    ]);

    $this->actingAs($this->sellerUser)
        ->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/orders/index')
            ->has('orders.data', 1)
        );

    $this->actingAs($this->sellerUser)
        ->get(route('seller.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/orders/show')
            ->where('order.status_raw', 'to_ship')
            ->where('order.can_ship', true)
        );
});

test('seller can fulfill order and transition status to to_receive', function () {
    $address = Address::factory()->create(['user_id' => $this->sellerUser->id]);

    $shipping = ShippingOption::first() ?? ShippingOption::create([
        'name' => 'Standard Delivery',
        'fee' => 8000,
    ]);

    $order = Order::create([
        'user_id' => $this->buyerUser->id,
        'shop_id' => $this->shop->id,
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
        'status' => OrderStatus::ToShip,
        'subtotal' => 50000,
        'shipping_fee' => 8000,
        'total' => 58000,
    ]);

    $this->actingAs($this->sellerUser)
        ->post(route('seller.orders.shipment.store', $order), [
            'tracking_number' => 'TRACK-998877',
            'courier_name' => 'J&T Express',
        ])
        ->assertRedirect(route('seller.orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::ToReceive);

    $this->assertDatabaseHas('order_events', [
        'order_id' => $order->id,
        'title' => 'Parcel shipped',
    ]);
});

test('seller cannot fulfill another shops order', function () {
    $address = Address::factory()->create(['user_id' => $this->sellerUser->id]);

    $shipping = ShippingOption::first() ?? ShippingOption::create([
        'name' => 'Standard Delivery',
        'fee' => 8000,
    ]);

    $otherOrder = Order::create([
        'user_id' => $this->buyerUser->id,
        'shop_id' => $this->otherShop->id,
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
        'status' => OrderStatus::ToShip,
        'subtotal' => 50000,
        'shipping_fee' => 8000,
        'total' => 58000,
    ]);

    $this->actingAs($this->sellerUser)
        ->post(route('seller.orders.shipment.store', $otherOrder), [
            'tracking_number' => 'FAKE',
        ])
        ->assertNotFound();
});

test('seller can view and update shop settings', function () {
    $this->actingAs($this->sellerUser)
        ->get(route('seller.settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/settings')
            ->has('settings')
        );

    $this->actingAs($this->sellerUser)
        ->put(route('seller.settings.update'), [
            'name' => 'Barakah Halal Pantry',
            'description' => 'Updated organic halal items.',
            'vacation_mode' => true,
            'auto_reply' => false,
            'shipping_channels' => [
                'standard' => true,
                'express' => true,
                'cod' => false,
            ],
        ])
        ->assertRedirect(route('seller.settings.edit'));

    $this->assertDatabaseHas('shops', [
        'id' => $this->shop->id,
        'name' => 'Barakah Halal Pantry',
        'vacation_mode' => true,
        'auto_reply' => false,
    ]);
});
