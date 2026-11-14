<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Route::get('/_test/feature-gated-video', fn () => response('ok'))
        ->middleware('feature:product_video_enabled');
});

test('feature gate middleware returns 404 when the feature is disabled', function (): void {
    Config::set('marketplace.features.product_video_enabled', false);

    $this->get('/_test/feature-gated-video')->assertNotFound();
});

test('feature gate middleware allows request when the feature is enabled', function (): void {
    Config::set('marketplace.features.product_video_enabled', true);

    $this->get('/_test/feature-gated-video')->assertOk();
});

test('s3 disk is configured with temporary_url and can be faked', function (): void {
    Storage::fake('s3');

    Storage::disk('s3')->put('test.txt', 'contents');

    Storage::disk('s3')->assertExists('test.txt');
    expect(config('filesystems.disks.s3.driver'))->toBe('s3')
        ->and(config('marketplace.video.max_kb'))->toBe(51200)
        ->and(config('marketplace.video.storage_prefix'))->toBe('media');
});
