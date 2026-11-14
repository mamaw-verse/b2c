<?php

declare(strict_types=1);

namespace Tests\Feature\Seller;

use App\Enums\ShopStaffStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;

uses(RefreshDatabase::class);

/**
 * S-11 — "Nothing destructive" guard.
 *
 * Iterates every DELETE route under the seller.* group and asserts that:
 *   - Staff gets 404, except for the self-removal route (seller.staff.destroy).
 *   - Staff cannot call seller.staff.store (cannot add staff).
 *   - Owner can call each DELETE route successfully (or at least not 404).
 *
 * When a new seller DELETE route is added it will automatically fail this
 * test until it is classified (added to the allow list or confirmed owner-only).
 */
test('staff is denied 404 on every seller DELETE route except self-removal', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $staff = User::factory()->create();
    $staffMembership = ShopStaff::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $staff->id,
        'email' => $staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $owner->id,
        'accepted_at' => now(),
    ]);

    $category = Category::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id, 'category_id' => $category->id]);
    $voucher = Voucher::factory()->create(['shop_id' => $shop->id, 'kind' => 'shop']);

    // Collect all DELETE routes under seller.* group
    $deleteRoutes = collect(RouteFacade::getRoutes()->getRoutes())
        ->filter(fn (Route $route) => in_array('DELETE', $route->methods(), true)
            && str_starts_with((string) $route->getName(), 'seller.')
        );

    expect($deleteRoutes)->not->toBeEmpty('No seller DELETE routes found — routing may have changed');

    foreach ($deleteRoutes as $route) {
        $routeName = $route->getName();

        // Self-removal: staff is allowed to leave the shop
        if ($routeName === 'seller.staff.destroy') {
            // Staff can delete their own membership — assert 404 is NOT returned
            $response = $this->actingAs($staff)->delete(
                route($routeName, ['staff' => $staffMembership->id])
            );
            expect($response->status())->not->toBe(404, "Staff should be able to remove themselves via {$routeName}");

            continue;
        }

        // For all other DELETE routes, resolve a plausible URL and assert 404 for staff
        $url = match ($routeName) {
            'seller.products.destroy' => route($routeName, ['product' => $product->id]),
            'seller.vouchers.destroy' => route($routeName, ['voucher' => $voucher->id]),
            default => route($routeName),
        };

        $this->actingAs($staff)->delete($url)->assertNotFound(
            "Staff should receive 404 on DELETE {$url} ({$routeName})"
        );
    }
});

test('staff cannot call seller.staff.store to invite new staff', function () {
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

    $this->actingAs($staff)->post('/seller/staff', [
        'email' => 'newstaff@example.com',
    ])->assertNotFound();
});

test('owner can call every seller DELETE route for their own resources', function () {
    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $category = Category::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id, 'category_id' => $category->id]);
    $voucher = Voucher::factory()->create(['shop_id' => $shop->id, 'kind' => 'shop']);

    $deleteRoutes = collect(RouteFacade::getRoutes()->getRoutes())
        ->filter(fn (Route $route) => in_array('DELETE', $route->methods(), true)
            && str_starts_with((string) $route->getName(), 'seller.')
        );

    foreach ($deleteRoutes as $route) {
        $routeName = $route->getName();

        // Skip self-removal for the owner — owner uses it to remove staff, not themselves
        if ($routeName === 'seller.staff.destroy') {
            continue;
        }

        $url = match ($routeName) {
            'seller.products.destroy' => route($routeName, ['product' => $product->id]),
            'seller.vouchers.destroy' => route($routeName, ['voucher' => $voucher->id]),
            default => route($routeName),
        };

        $response = $this->actingAs($owner)->delete($url);

        expect($response->status())->not->toBe(404, "Owner should not get 404 on DELETE {$url} ({$routeName})");
    }
});
