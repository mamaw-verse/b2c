<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Support\ActiveShop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;

uses(RefreshDatabase::class);

/** Make `$user` active staff at `$shop`. */
function joinAsStaff(User $user, Shop $shop): ShopStaff
{
    return ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $user->id,
        'email' => $user->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $shop->user_id,
        'accepted_at' => now(),
    ]);
}

/** An owner-and-staff account: owns "Own Shop", manages "Managed Shop". */
function dualRoleSetup(): array
{
    $user = User::factory()->create();
    $own = Shop::factory()->create(['user_id' => $user->id, 'name' => 'Own Shop']);

    $otherOwner = User::factory()->create();
    $managed = Shop::factory()->create(['user_id' => $otherOwner->id, 'name' => 'Managed Shop']);
    joinAsStaff($user, $managed);

    return compact('user', 'own', 'managed', 'otherOwner');
}

function orderFor(Shop $shop, ?User $buyer = null): Order
{
    $order = Order::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => ($buyer ?? User::factory()->create())->id,
        'status' => OrderStatus::ToShip,
    ]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => Category::factory()->create()->id,
    ]);
    OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);

    return $order;
}

// ---------------------------------------------------------------------------
// 1. Multi-shop staff membership
// ---------------------------------------------------------------------------

test('one account can be active staff at several shops at once', function () {
    $staff = User::factory()->create();
    $shopA = Shop::factory()->create();
    $shopB = Shop::factory()->create();

    joinAsStaff($staff, $shopA);
    joinAsStaff($staff, $shopB);

    expect($staff->operatedShops())->toHaveCount(2)
        ->and($staff->operatedShops()->pluck('shop.id')->all())->toEqualCanonicalizing([$shopA->id, $shopB->id]);
});

test('the same person cannot join the same shop twice', function () {
    $staff = User::factory()->create();
    $shop = Shop::factory()->create();

    joinAsStaff($staff, $shop);

    expect(fn () => ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => 'second-row@example.com',
        'status' => ShopStaffStatus::Active,
    ]))->toThrow(Illuminate\Database\QueryException::class);
});

test('status is per membership: pending or removed rows grant nothing at that shop only', function () {
    $staff = User::factory()->create();
    $active = Shop::factory()->create();
    $pendingShop = Shop::factory()->create();

    joinAsStaff($staff, $active);
    ShopStaff::factory()->create([
        'shop_id' => $pendingShop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Pending,
    ]);

    expect($staff->operatedShops()->pluck('shop.id')->all())->toBe([$active->id]);

    $this->actingAs($staff)->put('/seller/active-shop', ['shop_id' => $pendingShop->id])->assertNotFound();
});

test('a user can accept an invitation to a second shop while owning or staffing another', function () {
    ['user' => $user, 'own' => $own] = dualRoleSetup();

    $inviter = User::factory()->create();
    $newShop = Shop::factory()->create(['user_id' => $inviter->id, 'name' => 'Third Shop']);
    $invite = ShopStaff::factory()->create([
        'shop_id' => $newShop->id,
        'email' => $user->email,
        'status' => ShopStaffStatus::Pending,
        'invited_by' => $inviter->id,
        'invited_at' => now(),
    ]);

    $signed = URL::temporarySignedRoute('staff-invitations.show', now()->addDays(7), ['staffInvitation' => $invite->id]);

    $this->actingAs($user)->get($signed)->assertOk();
    $this->actingAs($user)->put("/staff-invitations/{$invite->id}")->assertRedirect('/seller/orders');

    expect($invite->fresh()->status)->toBe(ShopStaffStatus::Active)
        ->and($user->fresh()->operatedShops())->toHaveCount(3);

    // The shop they just joined becomes the active one.
    $this->actingAs($user)->get('/seller/orders')
        ->assertInertia(fn ($page) => $page->where('seller.shop_id', $newShop->id)->where('seller.role', 'staff'));
});

test('a staff member of one shop may apply to open their own shop', function () {
    $staff = User::factory()->create();
    joinAsStaff($staff, Shop::factory()->create());

    $this->actingAs($staff)->get('/seller/register')->assertOk();
});

// ---------------------------------------------------------------------------
// 2. Dual ownership and staff capability
// ---------------------------------------------------------------------------

test('an owner who also staffs another shop defaults to the shop they own', function () {
    ['user' => $user, 'own' => $own] = dualRoleSetup();

    $this->actingAs($user)->get('/seller/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('seller.shop_id', $own->id)->where('seller.role', 'owner'));
});

test('owner privileges never carry over into a managed shop', function (string $path) {
    ['user' => $user, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id])->assertRedirect('/seller/orders');

    // The user owns a shop, but in the active (managed) shop they are staff.
    $this->actingAs($user)->get($path)->assertNotFound();
})->with(['/seller/dashboard', '/seller/finance', '/seller/vouchers', '/seller/settings', '/seller/staff']);

test('owner-only mutations in a managed shop are refused and never touch the owned shop', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);

    $this->actingAs($user)->put('/seller/settings', ['name' => 'Hijacked'])->assertNotFound();
    $this->actingAs($user)->post('/seller/staff', ['email' => 'new@example.com'])->assertNotFound();
    $this->actingAs($user)->post('/seller/payouts', ['amount' => 50000])->assertNotFound();

    expect($own->fresh()->name)->toBe('Own Shop')
        ->and($managed->fresh()->name)->toBe('Managed Shop')
        ->and(ShopStaff::where('email', 'new@example.com')->exists())->toBeFalse();
});

test('owner pages act on the owned shop after switching back', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $own->id])->assertRedirect('/seller/dashboard');

    $this->actingAs($user)->get('/seller/finance')->assertOk();
    $this->actingAs($user)->get('/seller/settings')->assertOk();
});

test('a user cannot staff their own shop', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)->post('/seller/staff', ['email' => $owner->email])->assertSessionHasErrors(['email']);
    expect($shop->staff()->count())->toBe(0);
});

// ---------------------------------------------------------------------------
// 3. Shop switcher and active-shop context
// ---------------------------------------------------------------------------

test('shared props list every operated shop with a per-shop role and the active flag', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('seller.shops', 2)
            ->where('seller.shops.0.id', $own->id)
            ->where('seller.shops.0.role', 'owner')
            ->where('seller.shops.0.active', true)
            ->where('seller.shops.1.id', $managed->id)
            ->where('seller.shops.1.role', 'staff')
            ->where('seller.shops.1.active', false));
});

test('switching shops needs no re-login and the choice persists across requests', function () {
    ['user' => $user, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id])
        ->assertRedirect('/seller/orders')
        ->assertSessionHas(ActiveShop::SESSION_KEY, $managed->id);

    foreach (['/seller/orders', '/seller/products', '/seller/chat'] as $path) {
        $this->actingAs($user)->get($path)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('seller.shop_id', $managed->id)->where('seller.role', 'staff'));
    }
});

test('data is strictly scoped to the active shop', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();
    $ownOrder = orderFor($own);
    $managedOrder = orderFor($managed);

    // Active = owned shop: its order opens, the managed shop's order is a 404.
    $this->actingAs($user)->get("/seller/orders/{$ownOrder->id}")->assertOk();
    $this->actingAs($user)->get("/seller/orders/{$managedOrder->id}")->assertNotFound();

    // Active = managed shop: the reverse.
    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->get("/seller/orders/{$managedOrder->id}")->assertOk();
    $this->actingAs($user)->get("/seller/orders/{$ownOrder->id}")->assertNotFound();
});

test('seller chat is scoped to the active shop', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();
    $ownChat = Conversation::factory()->create(['shop_id' => $own->id]);
    $managedChat = Conversation::factory()->create(['shop_id' => $managed->id]);

    $this->actingAs($user)->get("/seller/chat/{$ownChat->id}")->assertOk();
    $this->actingAs($user)->get("/seller/chat/{$managedChat->id}")->assertNotFound();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->get("/seller/chat/{$managedChat->id}")->assertOk();
    $this->actingAs($user)->get("/seller/chat/{$ownChat->id}")->assertNotFound();
});

// ---------------------------------------------------------------------------
// Edge cases: unauthorised switching, removal mid-session, suspension
// ---------------------------------------------------------------------------

test('switching to a shop the user does not operate is a 404 and changes nothing', function () {
    ['user' => $user, 'own' => $own] = dualRoleSetup();
    $stranger = Shop::factory()->create();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $stranger->id])
        ->assertNotFound()
        ->assertSessionHas(ActiveShop::SESSION_KEY, $own->id);

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => 'does-not-exist'])->assertNotFound();
    $this->actingAs($user)->put('/seller/active-shop', [])->assertSessionHasErrors(['shop_id']);

    $this->actingAs($user)->get('/seller/orders')
        ->assertInertia(fn ($page) => $page->where('seller.shop_id', $own->id));
});

test('a forged session value for a shop the user does not operate is ignored', function () {
    ['user' => $user, 'own' => $own] = dualRoleSetup();
    $stranger = Shop::factory()->create();

    $this->actingAs($user)
        ->withSession([ActiveShop::SESSION_KEY => $stranger->id])
        ->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('seller.shop_id', $own->id));
});

test('guests, buyers and admins cannot use the switch endpoint', function () {
    $shop = Shop::factory()->create();

    $this->put('/seller/active-shop', ['shop_id' => $shop->id])->assertRedirect('/login');
    $this->actingAs(User::factory()->create())->put('/seller/active-shop', ['shop_id' => $shop->id])->assertNotFound();
    $this->actingAs(User::factory()->create(['role' => 'admin']))->put('/seller/active-shop', ['shop_id' => $shop->id])->assertNotFound();
});

test('removed from the active shop mid-session, the user falls back to a shop they still operate', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->get('/seller/orders')->assertInertia(fn ($page) => $page->where('seller.shop_id', $managed->id));

    // The managed shop's owner removes this user while their session is live.
    ShopStaff::where('shop_id', $managed->id)->where('user_id', $user->id)->delete();

    $this->actingAs($user)->get('/seller/orders')
        ->assertOk()
        ->assertSessionHas('error')
        ->assertInertia(fn ($page) => $page->where('seller.shop_id', $own->id)->where('seller.role', 'owner'));

    // And the managed shop's data is no longer reachable.
    $order = orderFor($managed);
    $this->actingAs($user)->get("/seller/orders/{$order->id}")->assertNotFound();
});

test('removed from their only shop mid-session, the user is sent back to the application flow', function () {
    $staff = User::factory()->create();
    $shop = Shop::factory()->create();
    $membership = joinAsStaff($staff, $shop);

    $this->actingAs($staff)->get('/seller/orders')->assertOk();

    $membership->delete();

    $this->actingAs($staff)->get('/seller/orders')->assertRedirect(route('seller.register'));
    $this->actingAs($staff)->get('/seller/customers')->assertRedirect(route('seller.register'));
});

test('leaving one shop keeps the user in the seller workspace when they still operate another', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();
    $membership = ShopStaff::where('shop_id', $managed->id)->where('user_id', $user->id)->firstOrFail();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->delete("/seller/staff/{$membership->id}")->assertRedirect('/seller/dashboard');

    expect($user->fresh()->operatedShops()->pluck('shop.id')->all())->toBe([$own->id]);
});

test('a suspended active shop can be left through the switcher', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();
    $managed->update(['suspended' => true]);

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);
    $this->actingAs($user)->get('/seller/orders')->assertRedirect(route('seller.suspended'));

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $own->id])->assertRedirect();
    $this->actingAs($user)->get('/seller/dashboard')->assertOk();
});

test('an owner can remove staff only in the shop they are currently acting in', function () {
    ['user' => $user, 'own' => $own] = dualRoleSetup();
    $helper = User::factory()->create();
    $row = joinAsStaff($helper, $own);

    // A second account that owns a different shop cannot remove them.
    $otherOwner = User::factory()->create();
    Shop::factory()->create(['user_id' => $otherOwner->id]);
    $this->actingAs($otherOwner)->delete("/seller/staff/{$row->id}")->assertNotFound();

    $this->actingAs($user)->delete("/seller/staff/{$row->id}")->assertRedirect();
    expect(ShopStaff::find($row->id))->toBeNull();
});

// ---------------------------------------------------------------------------
// 4. Staff access to customer pages
// ---------------------------------------------------------------------------

test('staff see the customer list and details of the active shop only', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $staff = User::factory()->create();
    joinAsStaff($staff, $shop);

    $mine = User::factory()->create();
    $someoneElses = User::factory()->create();
    orderFor($shop, $mine);
    orderFor(Shop::factory()->create(), $someoneElses);

    $this->actingAs($staff)->get('/seller/customers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/customers')
            ->has('customers', 1)
            ->where('customers.0.id', $mine->id));

    $this->actingAs($staff)->get("/seller/customers/{$mine->id}")->assertOk();
    $this->actingAs($staff)->get("/seller/customers/{$someoneElses->id}")->assertNotFound();
});

test('customer data follows the shop switcher', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = dualRoleSetup();
    $ownCustomer = User::factory()->create();
    $managedCustomer = User::factory()->create();
    orderFor($own, $ownCustomer);
    orderFor($managed, $managedCustomer);

    $this->actingAs($user)->get("/seller/customers/{$managedCustomer->id}")->assertNotFound();

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);

    $this->actingAs($user)->get('/seller/customers')
        ->assertInertia(fn ($page) => $page->has('customers', 1)->where('customers.0.id', $managedCustomer->id));
    $this->actingAs($user)->get("/seller/customers/{$managedCustomer->id}")->assertOk();
    $this->actingAs($user)->get("/seller/customers/{$ownCustomer->id}")->assertNotFound();
});

test('staff on a suspended shop cannot read customers', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id, 'suspended' => true]);
    $staff = User::factory()->create();
    joinAsStaff($staff, $shop);

    $this->actingAs($staff)->get('/seller/customers')->assertRedirect(route('seller.suspended'));
});

test('customer pages stay read-only and owner-only actions stay denied for staff', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $staff = User::factory()->create();
    joinAsStaff($staff, $shop);
    $buyer = User::factory()->create();
    orderFor($shop, $buyer);

    $this->actingAs($staff)->put("/seller/customers/{$buyer->id}")->assertStatus(405);
    $this->actingAs($staff)->delete("/seller/customers/{$buyer->id}")->assertStatus(405);
    $this->actingAs($staff)->get('/seller/finance')->assertNotFound();
});
