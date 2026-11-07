<?php

declare(strict_types=1);

use App\Models\ModerationQueueItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin routes render admin shell components', function (string $uri) {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = ModerationQueueItem::factory()->create();

    $response = $this->actingAs($admin)->get(str_replace('{item}', $item->id, $uri));

    $response->assertOk();
    expect($response->viewData('page')['component'])->toStartWith('admin/');
})->with([
    'dashboard' => '/admin/dashboard',
    'queue index' => '/admin/moderation',
    'queue show' => '/admin/moderation/{item}',
]);
