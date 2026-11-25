<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdminOnly
{
    /**
     * Deny-by-default inside the Admin workspace: editors may enter it (`workspace:admin`),
     * but every route is admin-only unless it sits in the `blog.manage` group
     * (docs/planning/15-blog.md §6.5).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            abort(404);
        }

        return $next($request);
    }
}
