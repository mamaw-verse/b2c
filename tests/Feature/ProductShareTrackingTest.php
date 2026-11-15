<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductShareStat;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
    ]);
    $this->category = Category::factory()->create();
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
    ]);

    Config::set('marketplace.features.product_share_enabled', true);
    Config::set('marketplace.share.channels', ['copy', 'facebook', 'messenger', 'x', 'native']);
    Config::set('marketplace.share.dedupe_minutes', 10);
    Cache::flush();
    RateLimiter::clear('product-share:127.0.0.1');
});

test('counts a valid channel: row created, share_count = 1', function () {
    $response = $this->postJson(route('products.shares.store', $this->product), [
        'channel' => 'facebook',
    ]);

    $response->assertNoContent();

    expect($this->product->fresh()->share_count)->toBe(1);

    $stat = ProductShareStat::where('product_id', $this->product->id)
        ->where('channel', 'facebook')
        ->where('shared_on', today()->toDateString())
        ->first();

    expect($stat)->not->toBeNull()
        ->and($stat->count)->toBe(1);
});

test('repeat within dedupe window not counted; counted after time travel', function () {
    $endpoint = route('products.shares.store', $this->product);

    $this->postJson($endpoint, ['channel' => 'facebook'])->assertNoContent();
    expect($this->product->fresh()->share_count)->toBe(1);

    // Immediate repeat within dedupe window
    $this->postJson($endpoint, ['channel' => 'facebook'])->assertNoContent();
    expect($this->product->fresh()->share_count)->toBe(1);

    $stat = ProductShareStat::where('product_id', $this->product->id)->first();
    expect($stat->count)->toBe(1);

    // Advance time past the 10-minute dedupe window
    $this->travel(11)->minutes();

    $this->postJson($endpoint, ['channel' => 'facebook'])->assertNoContent();
    expect($this->product->fresh()->share_count)->toBe(2);

    $stat->refresh();
    expect($stat->count)->toBe(2);
});

test('two different channels both count', function () {
    $endpoint = route('products.shares.store', $this->product);

    $this->postJson($endpoint, ['channel' => 'facebook'])->assertNoContent();
    $this->postJson($endpoint, ['channel' => 'x'])->assertNoContent();

    expect($this->product->fresh()->share_count)->toBe(2);

    $facebookStat = ProductShareStat::where('product_id', $this->product->id)->where('channel', 'facebook')->first();
    $xStat = ProductShareStat::where('product_id', $this->product->id)->where('channel', 'x')->first();

    expect($facebookStat->count)->toBe(1)
        ->and($xStat->count)->toBe(1);
});

test('unknown channel returns 422', function () {
    $response = $this->postJson(route('products.shares.store', $this->product), [
        'channel' => 'myspace',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['channel']);

    expect($this->product->fresh()->share_count)->toBe(0)
        ->and(ProductShareStat::count())->toBe(0);
});

test('disabled feature flag returns 404', function () {
    Config::set('marketplace.features.product_share_enabled', false);

    $response = $this->postJson(route('products.shares.store', $this->product), [
        'channel' => 'facebook',
    ]);

    $response->assertNotFound();

    expect($this->product->fresh()->share_count)->toBe(0)
        ->and(ProductShareStat::count())->toBe(0);
});

test('unpublished or hidden product returns 404', function () {
    $unpublished = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $this->postJson(route('products.shares.store', $unpublished), ['channel' => 'facebook'])
        ->assertNotFound();
});

test('rate limit: 31st request within a minute returns 429', function () {
    $endpoint = route('products.shares.store', $this->product);

    for ($i = 0; $i < 30; $i++) {
        $this->postJson($endpoint, ['channel' => 'copy'])->assertNoContent();
    }

    $response = $this->postJson($endpoint, ['channel' => 'copy']);
    $response->assertStatus(429);
});

test('guest and signed-in buyer both allowed', function () {
    $endpoint = route('products.shares.store', $this->product);

    // Guest
    $this->postJson($endpoint, ['channel' => 'facebook'])->assertNoContent();

    // Signed-in user
    $user = User::factory()->create();
    $this->actingAs($user)
        ->postJson($endpoint, ['channel' => 'x'])
        ->assertNoContent();

    expect($this->product->fresh()->share_count)->toBe(2);
});

test('no IP or user id column exists on product_share_stats table', function () {
    $columns = Schema::getColumnListing('product_share_stats');

    expect($columns)->not->toContain('ip')
        ->and($columns)->not->toContain('ip_address')
        ->and($columns)->not->toContain('user_id');
});

test('an exception inside the action still returns 204', function () {
    DB::shouldReceive('transaction')->andThrow(new RuntimeException('Database unreachable'));

    $response = $this->postJson(route('products.shares.store', $this->product), [
        'channel' => 'facebook',
    ]);

    $response->assertNoContent();
});
