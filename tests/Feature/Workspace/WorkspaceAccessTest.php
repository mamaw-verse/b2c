<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function sellerWithShop(array $shopState = []): User
{
    $user = User::factory()->create();
    Shop::factory()->create(array_merge(['user_id' => $user->id], $shopState));

    return $user;
}

test('guests are redirected to login for workspace pages', function (string $url) {
    $this->get($url)->assertRedirect(route('login'));
})->with([
    '/account',
    '/seller/dashboard',
    '/seller/products',
    '/admin/dashboard',
    '/admin/moderation',
    '/seller/suspended',
]);

test('buyer without a shop can use the buyer workspace but not seller or admin', function () {
    $buyer = User::factory()->create();

    $this->actingAs($buyer)->get('/account')->assertOk();
    $this->actingAs($buyer)->get('/seller/dashboard')->assertRedirect(route('seller.register'));
    $this->actingAs($buyer)->get('/seller/products')->assertRedirect(route('seller.register'));
    $this->actingAs($buyer)->get('/admin/dashboard')->assertNotFound();
    $this->actingAs($buyer)->get('/admin/moderation')->assertNotFound();
});

test('pending and rejected sellers are sent back to the application flow', function (string $state) {
    $user = User::factory()->create();
    Shop::factory()->{$state}()->create(['user_id' => $user->id]);

    $this->actingAs($user)->get('/seller/dashboard')->assertRedirect(route('seller.register'));
    $this->actingAs($user)->get('/seller/products')->assertRedirect(route('seller.register'));
    $this->actingAs($user)->get('/seller/register')->assertOk();
    $this->actingAs($user)->get('/account')->assertOk();
})->with(['pending', 'rejected', 'changesRequested']);

test('approved sellers reach the seller workspace but only their own data', function () {
    $seller = sellerWithShop();
    $otherSeller = sellerWithShop();
    $otherOrder = Order::factory()->create(['shop_id' => $otherSeller->shop->id]);

    $this->actingAs($seller)->get('/seller/dashboard')->assertOk();
    $this->actingAs($seller)->get('/seller/products')->assertOk();
    $this->actingAs($seller)->get('/seller/orders/'.$otherOrder->id)->assertNotFound();
    $this->actingAs($seller)->get('/admin/dashboard')->assertNotFound();
    $this->actingAs($seller)->get('/seller/register')->assertNotFound();
});

test('suspended sellers get a read-only status page and no mutations', function () {
    $seller = sellerWithShop();
    $seller->shop->update(['suspended' => true]);

    // Reads are redirected to the status page.
    $this->actingAs($seller)->get('/seller/dashboard')->assertRedirect(route('seller.suspended'));
    $this->actingAs($seller)->get('/seller/products')->assertRedirect(route('seller.suspended'));
    $this->actingAs($seller)->get('/seller/orders')->assertRedirect(route('seller.suspended'));
    $this->actingAs($seller)->get('/seller/settings')->assertRedirect(route('seller.suspended'));

    // The status page itself is reachable.
    $this->actingAs($seller)->get('/seller/suspended')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('seller/suspended')
                ->where('shop.name', $seller->shop->name),
        );

    // Mutations are denied.
    $this->actingAs($seller)->put('/seller/settings', [
        'name' => 'New Name',
    ])->assertForbidden();
    $this->actingAs($seller)->post('/seller/products', [])->assertForbidden();

    $conversation = App\Models\Conversation::factory()->create([
        'shop_id' => $seller->shop->id,
    ]);
    $this->actingAs($seller)->post("/seller/chat/{$conversation->id}/messages", [])->assertForbidden();
});

test('the suspended page is hidden from sellers in good standing', function () {
    $seller = sellerWithShop();

    $this->actingAs($seller)->get('/seller/suspended')->assertNotFound();

    $buyer = User::factory()->create();
    $this->actingAs($buyer)->get('/seller/suspended')->assertNotFound();
});

test('non-admins get 404 across the admin workspace', function () {
    $seller = sellerWithShop();

    $this->actingAs($seller)->get('/admin/dashboard')->assertNotFound();
    $this->actingAs($seller)->get('/admin/moderation')->assertNotFound();
});

test('admins are confined to the admin workspace and profile settings', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Shop::factory()->create(['user_id' => $admin->id]);

    $this->actingAs($admin)->get('/admin/dashboard')->assertOk();
    $this->actingAs($admin)->get('/admin/moderation')->assertOk();

    // Buyer and seller surfaces are stripped for admins — reads send them
    // back to the admin dashboard, even when they own an approved shop.
    foreach (['/account', '/account/orders', '/account/chat', '/account/notifications', '/seller/dashboard', '/seller/products', '/seller/register', '/seller/suspended'] as $url) {
        $this->actingAs($admin)->get($url)->assertRedirect(route('admin.dashboard'));
    }

    // Profile settings stay reachable.
    $this->actingAs($admin)->get('/settings/profile')->assertOk();

    // Mutations on stripped surfaces are denied outright.
    $this->actingAs($admin)->post('/account/chat')->assertNotFound();
    $this->actingAs($admin)->post('/notifications/read')->assertNotFound();
    $this->actingAs($admin)->post('/seller/register')->assertNotFound();
    $this->actingAs($admin)->put('/seller/settings')->assertNotFound();
});

test('the shared workspaces prop lists exactly the allowed workspaces and marks the current one', function () {
    $buyer = User::factory()->create();
    $this->actingAs($buyer)->get('/account')
        ->assertInertia(fn ($page) => $page
            ->has('workspaces', 1)
            ->where('workspaces.0.key', 'buyer')
            ->where('workspaces.0.current', true)
            ->where('seller', null),
        );

    $seller = sellerWithShop();
    $this->actingAs($seller)->get('/seller/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('workspaces', 2)
            ->where('workspaces.0.key', 'buyer')
            ->where('workspaces.0.current', false)
            ->where('workspaces.1.key', 'seller')
            ->where('workspaces.1.current', true)
            ->where('seller.status', 'approved')
            ->where('seller.suspended', false),
        );

    // Admins get a single unified shell — only the admin workspace is
    // listed, even when they also own an approved shop.
    $adminSeller = User::factory()->create(['role' => 'admin']);
    Shop::factory()->create(['user_id' => $adminSeller->id]);
    $this->actingAs($adminSeller)->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('workspaces', 1)
            ->where('workspaces.0.key', 'admin')
            ->where('workspaces.0.current', true),
        );

    // The single admin workspace stays "current" on settings URLs too, so
    // the unified shell keeps showing Admin as the active workspace.
    $this->actingAs($adminSeller)->get('/settings/profile')
        ->assertInertia(fn ($page) => $page
            ->has('workspaces', 1)
            ->where('workspaces.0.key', 'admin')
            ->where('workspaces.0.current', true),
        );
});

test('legacy dashboard, chat and notifications urls redirect to the buyer workspace', function () {
    $buyer = User::factory()->create();

    $this->actingAs($buyer)->get('/dashboard')->assertRedirect('/account');
    $this->actingAs($buyer)->get('/chat')->assertRedirect('/account/chat');
    $this->actingAs($buyer)->get('/notifications')->assertRedirect('/account/notifications');
});

test('the last workspace picks the post-login destination when still allowed', function () {
    $seller = sellerWithShop();

    $response = $this->withSession(['last_workspace' => 'seller'])
        ->post(route('login'), [
            'email' => $seller->email,
            'password' => 'password',
        ]);

    $response->assertRedirect('/seller/dashboard');
});

test('a lost workspace falls back to the buyer account after login', function () {
    $buyer = User::factory()->create();

    $response = $this->withSession(['last_workspace' => 'seller'])
        ->post(route('login'), [
            'email' => $buyer->email,
            'password' => 'password',
        ]);

    $response->assertRedirect('/account');
});
