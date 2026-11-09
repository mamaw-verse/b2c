<?php

declare(strict_types=1);

use App\Enums\VoucherKind;
use App\Models\Shop;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin voucher list only shows platform vouchers', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $platform = Voucher::factory()->create();
    Voucher::factory()->shopVoucher()->create(['shop_id' => Shop::factory()->create()->id]);

    $response = $this->actingAs($admin)->get(route('admin.vouchers.index'));

    $response->assertOk();
    $vouchers = $response->viewData('page')['props']['vouchers'];
    expect(collect($vouchers)->pluck('id'))->toContain($platform->id)->toHaveCount(1);
});

test('admin can create a platform voucher with peso amounts stored as centavos', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.vouchers.store'), [
        'kind' => 'platform',
        'code' => 'welcome10',
        'discount_type' => 'fixed',
        'discount_value' => '50.00',
        'min_spend' => '200',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('admin.vouchers.index'));

    $voucher = Voucher::where('code', 'WELCOME10')->first();
    expect($voucher)->not->toBeNull()
        ->and($voucher->kind)->toBe(VoucherKind::Platform)
        ->and($voucher->discount_value)->toBe(5000)
        ->and($voucher->min_spend)->toBe(20000)
        ->and($voucher->shop_id)->toBeNull();

    $this->assertDatabaseHas('audit_logs', ['action' => 'voucher.created', 'actor_id' => $admin->id]);
});

test('percent vouchers require a max discount and cap at 100 percent', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.vouchers.store'), [
        'kind' => 'platform',
        'code' => 'PCT50',
        'discount_type' => 'percent',
        'discount_value' => 50,
        'is_active' => true,
    ])->assertSessionHasErrors('max_discount');

    $this->actingAs($admin)->post(route('admin.vouchers.store'), [
        'kind' => 'platform',
        'code' => 'PCT50',
        'discount_type' => 'percent',
        'discount_value' => 150,
        'max_discount' => 100,
        'is_active' => true,
    ])->assertSessionHasErrors('discount_value');
});

test('admin cannot edit or delete a shop voucher through the platform endpoints', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $voucher = Voucher::factory()->shopVoucher()->create(['shop_id' => Shop::factory()->create()->id]);

    $this->actingAs($admin)->put(route('admin.vouchers.update', $voucher), [
        'kind' => 'platform',
        'code' => 'X',
        'discount_type' => 'fixed',
        'discount_value' => 10,
        'is_active' => true,
    ])->assertNotFound();

    $this->actingAs($admin)->delete(route('admin.vouchers.destroy', $voucher))->assertNotFound();
});

test('non-admin gets a not found response on voucher routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.vouchers.index'))->assertNotFound();
    $this->actingAs($user)->post(route('admin.vouchers.store'), [])->assertNotFound();
});
