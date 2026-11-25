<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureBlogEnabled
{
    /**
     * Every public blog route 404s while `config('blog.enabled')` is off, so the
     * blog can be deployed dark (docs/planning/15-blog.md B0.4).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! config()->boolean('blog.enabled', false)) {
            abort(404);
        }

        return $next($request);
    }
}
