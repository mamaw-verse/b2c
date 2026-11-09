<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-brand="{{ config('app.brand', 'default') }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Page not found - {{ config('app.name', 'Laravel') }}</title>
        @vite(['resources/css/app.css'])
    </head>
    <body class="grid min-h-dvh place-items-center bg-surface p-gutter text-foreground">
        <main class="grid max-w-md justify-items-center gap-3 text-center">
            <p class="text-eyebrow uppercase text-muted-foreground">404</p>
            <h1 class="text-h2">Page not found</h1>
            <p class="text-body text-muted-foreground">
                The page you're looking for doesn't exist or you don't have
                access to it.
            </p>
            @auth
                <a class="btn btn-primary mt-2" href="/account">Back to my account</a>
            @else
                <a class="btn btn-primary mt-2" href="/">Back to the storefront</a>
            @endauth
        </main>
    </body>
</html>
