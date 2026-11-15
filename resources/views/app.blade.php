<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-brand="{{ config('app.brand', 'default') }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#17643c">

        @if (isset($meta))
            <link rel="canonical" href="{{ $meta['url'] }}">
            <meta name="description" content="{{ $meta['description'] }}">
            <meta property="og:type" content="product">
            <meta property="og:title" content="{{ $meta['title'] }}">
            <meta property="og:description" content="{{ $meta['description'] }}">
            <meta property="og:url" content="{{ $meta['url'] }}">
            <meta property="og:image" content="{{ $meta['image'] }}">
            <meta property="og:site_name" content="{{ $meta['site_name'] }}">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="{{ $meta['title'] }}">
            <meta name="twitter:description" content="{{ $meta['description'] }}">
            <meta name="twitter:image" content="{{ $meta['image'] }}">
        @else
            <meta name="description" content="HalalBenta - Certified halal marketplace">
            <meta property="og:type" content="website">
            <meta property="og:title" content="{{ config('app.name', 'HalalBenta') }}">
            <meta property="og:description" content="Certified halal marketplace in the Philippines">
            <meta property="og:url" content="{{ url()->current() }}">
            <meta property="og:image" content="{{ asset('brand/og-image.png') }}">
            <meta property="og:site_name" content="HalalBenta">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="{{ config('app.name', 'HalalBenta') }}">
            <meta name="twitter:description" content="Certified halal marketplace in the Philippines">
            <meta name="twitter:image" content="{{ asset('brand/og-image.png') }}">
        @endif

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #f7f8f6;
            }

            html.dark {
                background-color: #0f1512;
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'HalalBenta') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
