<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\SeoData;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnforceSeoStandards
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check for 301 canonical redirects on GET/HEAD requests
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            $path = $request->path();
            $host = (string) $request->getHttpHost();
            $uri = $request->getRequestUri();

            // Skip static assets
            $isAsset = $request->is([
                'build/*',
                '@vite/*',
                'images/*',
                'brand/*',
                'storage/*',
                'media/*',
                'social/*',
                'favicon.*',
                'apple-touch-icon.png',
                'manifest.webmanifest',
                '_ignition/*',
            ]);

            if (! $isAsset) {
                $needsRedirect = false;
                $redirectHost = $host;
                $redirectScheme = $request->getScheme();

                // Strip www
                if (str_starts_with($host, 'www.')) {
                    $redirectHost = mb_substr($host, 4);
                    $needsRedirect = true;
                }

                // Force https in production if app.url is https
                if (app()->isProduction() && str_starts_with((string) config('app.url'), 'https://') && ! $request->secure()) {
                    $redirectScheme = 'https';
                    $needsRedirect = true;
                }

                // Lowercase path and strip trailing slash
                $cleanPath = '/'.mb_trim($path, '/');
                $lowercasePath = mb_strtolower($cleanPath);

                if ($cleanPath !== $lowercasePath) {
                    $needsRedirect = true;
                }

                $rawPath = parse_url($uri, PHP_URL_PATH) ?? '/';
                if ($rawPath !== '/' && str_ends_with($rawPath, '/')) {
                    $needsRedirect = true;
                }

                if ($needsRedirect) {
                    $query = $request->getQueryString();
                    $targetPath = $lowercasePath === '/' ? '/' : $lowercasePath;
                    $targetUrl = $redirectScheme.'://'.$redirectHost.$targetPath.($query ? '?'.$query : '');

                    return redirect()->to($targetUrl, 301);
                }
            }
        }

        $response = $next($request);

        // 2. Set X-Robots-Tag header
        $path = $request->path();
        $robots = SeoData::defaultRobots($path);
        $response->headers->set('X-Robots-Tag', $robots);

        return $response;
    }
}
