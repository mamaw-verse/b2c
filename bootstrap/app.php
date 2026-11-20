<?php

declare(strict_types=1);

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(App\Http\Middleware\EnforceSeoStandards::class);
        // human_pass is encrypted by App\Support\HumanPass itself.
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', App\Support\HumanPass::COOKIE_NAME]);

        $middleware->web(append: [
            HandleAppearance::class,
            App\Http\Middleware\CaptureAffiliateReferral::class,
            App\Http\Middleware\EnsureUserNotSuspended::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'workspace' => App\Http\Middleware\EnsureWorkspaceAccess::class,
            'feature' => App\Http\Middleware\EnsureFeatureEnabled::class,
            'human' => App\Http\Middleware\EnsureHumanPass::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
