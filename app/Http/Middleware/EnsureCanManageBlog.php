<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureCanManageBlog
{
    /**
     * Admins and editors only; everyone else gets a 404.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->canManageBlog()) {
            abort(404);
        }

        return $next($request);
    }
}
