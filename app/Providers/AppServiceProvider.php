<?php

declare(strict_types=1);

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

final class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Support\Seo::class);

        $this->app->singleton(\App\Services\TurnstileVerifier::class, fn (): \App\Services\TurnstileVerifier => new \App\Services\TurnstileVerifier(
            secret: (string) config('services.turnstile.secret'),
            expectedHostname: config('humancheck.expected_hostname'),
            expectedAction: config('humancheck.expected_action'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::model('admin', \App\Models\User::class);

        $this->registerBlogBindings();

        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Public blog route bindings. They use their own parameter names (`blogPost`, `blogAuthor`) so the
     * admin screens, which bind `{post}` / `{author}` to any status, are unaffected.
     */
    protected function registerBlogBindings(): void
    {
        // Live posts only (draft, scheduled, archived and soft-deleted are 404). A retired slug 301s
        // to the post's current URL, but only when that post is itself live.
        Route::bind('blogPost', static function (string $slug): \App\Models\BlogPost {
            abort_unless(config()->boolean('blog.enabled', false), 404);

            $post = \App\Models\BlogPost::query()->live()->where('slug', $slug)->first();
            if ($post !== null) {
                return $post;
            }

            $current = \App\Models\BlogPostSlugHistory::query()
                ->where('slug', $slug)
                ->first()
                ?->post()
                ->live()
                ->first();

            if ($current !== null) {
                abort(redirect()->route('blog.show', $current, 301));
            }

            abort(404);
        });

        // Author pages exist for active, non-house authors only (deactivated profiles and the house byline have no page).
        Route::bind('blogAuthor', static function (string $slug): \App\Models\BlogAuthor {
            abort_unless(config()->boolean('blog.enabled', false), 404);

            return \App\Models\BlogAuthor::query()
                ->where('slug', $slug)
                ->where('is_active', true)
                ->where('is_house', false)
                ->firstOrFail();
        });
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('human-check', static function (Request $request): Limit {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('product-share', static function (Request $request): Limit {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
