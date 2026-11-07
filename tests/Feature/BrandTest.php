<?php

declare(strict_types=1);

test('the configured brand renders as a data-brand attribute', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
    $response->assertSee('data-brand="'.config('app.brand').'"', false);
});
