<?php

declare(strict_types=1);

use App\Enums\VoucherKind;
use App\Models\Shop;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function voucherSeller(): array
{
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    return [$seller, $shop];
}

test('seller can create, update and delete a shop voucher', function () {
    [$seller, $shop] = voucherSeller();

    $this->actingAs($seller)->post(route('seller.vouchers.store'), [
        'code' => 'shop10',
        'discount_type' => 'fixed',
        'discount_value' => '25',
        'is_active' => true,
    ])->assertRedirect(route('seller.vouchers.index'));

    $voucher = Voucher::where('code', 'SHOP10')->first();
    expect($voucher)->not->toBeNull()
        ->and($voucher->kind)->toBe(VoucherKind::Shop)
        ->and($voucher->shop_id)->toBe($shop->id)
        ->and($voucher->discount_value)->toBe(2500);

    $this->actingAs($seller)->put(route('seller.vouchers.update', $voucher), [
        'code' => 'shop10',
        'discount_type' => 'fixed',
        'discount_value' => '30',
        'expires_at' => now()->addMonth()->toDateString(),
        'is_active' => false,
    ])->assertRedirect();

    expect($voucher->fresh()->discount_value)->toBe(3000)
        ->and($voucher->fresh()->is_active)->toBeFalse()
        ->and($voucher->fresh()->used_count)->toBe(0);

    $this->actingAs($seller)->delete(route('seller.vouchers.destroy', $voucher))->assertRedirect();
    expect(Voucher::find($voucher->id))->toBeNull();
});

test('seller cannot touch another shop voucher', function () {
    [$seller] = voucherSeller();
    $other = Voucher::factory()->shopVoucher()->create(['shop_id' => Shop::factory()->create()->id]);

    $this->actingAs($seller)->put(route('seller.vouchers.update', $other), [
        'code' => 'X',
        'discount_type' => 'fixed',
        'discount_value' => 10,
        'is_active' => true,
    ])->assertNotFound();

    $this->actingAs($seller)->delete(route('seller.vouchers.destroy', $other))->assertNotFound();
});

test('seller voucher list excludes other shops and platform vouchers', function () {
    [$seller, $shop] = voucherSeller();
    $own = Voucher::factory()->shopVoucher()->create(['shop_id' => $shop->id]);
    Voucher::factory()->shopVoucher()->create(['shop_id' => Shop::factory()->create()->id]);
    Voucher::factory()->create();

    $response = $this->actingAs($seller)->get(route('seller.vouchers.index'));

    $vouchers = $response->viewData('page')['props']['vouchers'];
    expect(collect($vouchers)->pluck('id'))->toContain($own->id)->toHaveCount(1);
});

test('voucher codes must be unique', function () {
    [$seller] = voucherSeller();
    Voucher::factory()->create(['code' => 'TAKEN']);

    $this->actingAs($seller)->post(route('seller.vouchers.store'), [
        'code' => 'taken',
        'discount_type' => 'fixed',
        'discount_value' => 10,
        'is_active' => true,
    ])->assertSessionHasErrors('code');
});

test('buyers are kept off seller voucher routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('seller.vouchers.index'))->assertRedirect(route('seller.register'));
    $this->actingAs($user)->post(route('seller.vouchers.store'), [])->assertNotFound();
});
