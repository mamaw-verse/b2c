<?php

declare(strict_types=1);

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('seller directory only shows approved unsuspended shops and applies search and halal filters', function () {
    $visible = Shop::factory()->create(['name' => 'Mina Halal Foods', 'halal_only' => true]);
    Shop::factory()->create(['name' => 'Mina Other Foods', 'halal_only' => false]);
    Shop::factory()->pending()->create(['name' => 'Mina Pending Foods', 'halal_only' => true]);
    Shop::factory()->suspended()->create(['name' => 'Mina Suspended Foods', 'halal_only' => true]);

    $this->get(route('shops.index', ['q' => 'Mina', 'halal_only' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sellers')
            ->where('shops.data.0.id', $visible->id)
            ->has('shops.data', 1)
            ->where('filters.halal_only', true));
});
