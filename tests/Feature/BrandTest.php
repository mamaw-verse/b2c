<?php

declare(strict_types=1);

test('the configured brand renders as a data-brand attribute', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
    $response->assertSee('data-brand="'.config('app.brand').'"', false);
});

test('app name is configured as HalalBenta and shared with inertia', function () {
    expect(config('app.name'))->toBe('HalalBenta');

    $response = $this->get(route('login'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('name', 'HalalBenta'));
});
