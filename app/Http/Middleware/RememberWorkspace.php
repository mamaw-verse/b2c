<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RememberWorkspace
{
    public const SESSION_KEY = 'last_workspace';

    /**
     * Remember which workspace the user last visited so the post-login
     * redirect can land there. Only workspace home surfaces count —
     * settings and shared pages do not move the marker.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() !== null && ($request->isMethod('GET') || $request->isMethod('HEAD'))) {
            $workspace = match (true) {
                $request->is('account', 'account/*') => Workspace::Buyer,
                $request->is('seller', 'seller/*') => Workspace::Seller,
                $request->is('admin', 'admin/*') => Workspace::Admin,
                default => null,
            };

            if ($workspace !== null && $workspace->accessibleBy($request->user()) && $request->hasSession()) {
                $request->session()->put(self::SESSION_KEY, $workspace->value);
            }
        }

        return $next($request);
    }
}
