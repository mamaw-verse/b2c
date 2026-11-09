<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureWorkspaceAccess
{
    /**
     * Safety net behind the workspace FormRequests. The URL decides who may
     * enter: `workspace:seller` requires an approved, unsuspended shop and
     * `workspace:admin` requires the admin role — anyone else is redirected
     * to the application flow or gets a 404. `workspace:buyer` covers the
     * account surfaces open to every verified non-admin.
     *
     * Admins live in a single unified shell: every buyer and seller
     * surface is stripped for them — reads send them back to the admin
     * dashboard, mutations 404.
     */
    public function handle(Request $request, Closure $next, string $workspace): Response
    {
        $isRead = $request->isMethod('GET') || $request->isMethod('HEAD');

        if ($workspace !== 'admin' && $request->user()?->isAdmin()) {
            if ($isRead && ! $request->expectsJson()) {
                return redirect()->route('admin.dashboard');
            }

            abort(404);
        }

        if ($workspace === 'admin') {
            if (! $request->user()?->isAdmin()) {
                abort(404);
            }

            return $next($request);
        }

        if ($workspace === 'seller') {
            $shop = $request->user()?->shop;

            if ($shop === null || ! $shop->isApproved()) {
                if ($isRead && ! $request->expectsJson()) {
                    return redirect()->route('seller.register');
                }

                abort(404);
            }

            if ($shop->suspended) {
                if ($isRead) {
                    return redirect()->route('seller.suspended');
                }

                abort(403);
            }

            return $next($request);
        }

        if ($workspace === 'buyer') {
            return $next($request);
        }

        abort(404);
    }
}
