<!DOCTYPE html>
<html lang="en-PH" data-brand="{{ config('app.brand', 'default') }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#17643c">
        <meta name="application-name" content="{{ config('app.name', 'HalalBenta') }}">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'HalalBenta') }}">

        @php
            /** @var \App\Support\SeoData $seo */
            $seo = $seo ?? app(\App\Support\Seo::class)->resolve();
        @endphp

        <meta name="description" content="{{ $seo->description }}">
        <link rel="canonical" href="{{ $seo->canonical }}">
        <meta name="robots" content="{{ $seo->robots }}">
        @php
            $author = $seo->author ?? $seo->og['article']['author'] ?? null;
        @endphp
        @if (!empty($author))
            <meta name="author" content="{{ $author }}">
        @endif

        {{-- Open Graph --}}
        <meta property="og:site_name" content="{{ $seo->og['site_name'] }}">
        <meta property="og:locale" content="{{ $seo->og['locale'] }}">
        <meta property="og:type" content="{{ $seo->og['type'] }}">
        <meta property="og:title" content="{{ $seo->og['title'] }}">
        <meta property="og:description" content="{{ $seo->og['description'] }}">
        <meta property="og:url" content="{{ $seo->og['url'] }}">
        <meta property="og:image" content="{{ $seo->og['image'] }}">
        @if (str_starts_with($seo->og['image'], 'https://'))
            <meta property="og:image:secure_url" content="{{ $seo->og['image'] }}">
        @endif
        <meta property="og:image:width" content="{{ $seo->og['image_width'] }}">
        <meta property="og:image:height" content="{{ $seo->og['image_height'] }}">
        <meta property="og:image:alt" content="{{ $seo->og['image_alt'] }}">
        <meta property="og:image:type" content="{{ $seo->og['image_type'] }}">
        @if (!empty($seo->og['updated_time']))
            <meta property="og:updated_time" content="{{ $seo->og['updated_time'] }}">
        @endif
        @if (!empty($seo->og['article']))
            @foreach (['published_time', 'modified_time', 'section', 'author'] as $articleKey)
                @if (!empty($seo->og['article'][$articleKey]))
                    <meta property="article:{{ $articleKey }}" content="{{ $seo->og['article'][$articleKey] }}">
                @endif
            @endforeach
            @foreach ((array) ($seo->og['article']['tags'] ?? []) as $articleTag)
                <meta property="article:tag" content="{{ $articleTag }}">
            @endforeach
        @endif

        {{-- Twitter --}}
        <meta name="twitter:card" content="{{ $seo->twitter['card'] }}">
        @php
            $twitterHandle = config('seo.twitter_handle');
            $twitterSite = $seo->twitter['site'] ?? ($twitterHandle ? '@'.ltrim((string) $twitterHandle, '@') : null);
        @endphp
        @if (!empty($twitterSite))
            <meta name="twitter:site" content="{{ $twitterSite }}">
        @endif
        <meta name="twitter:title" content="{{ $seo->twitter['title'] }}">
        <meta name="twitter:description" content="{{ $seo->twitter['description'] }}">
        <meta name="twitter:image" content="{{ $seo->twitter['image'] }}">
        <meta name="twitter:image:alt" content="{{ $seo->twitter['image_alt'] }}">
        @if (!empty($seo->twitter['labels']))
            @foreach ($seo->twitter['labels'] as $index => $item)
                <meta name="twitter:label{{ $index + 1 }}" content="{{ $item['label'] }}">
                <meta name="twitter:data{{ $index + 1 }}" content="{{ $item['data'] }}">
            @endforeach
        @endif

        {{-- Product Meta --}}
        @if (!empty($seo->product))
            <meta property="product:price:amount" content="{{ $seo->product['price_amount'] }}">
            <meta property="product:price:currency" content="{{ $seo->product['price_currency'] }}">
            <meta property="product:availability" content="{{ $seo->product['availability'] }}">
            <meta property="product:condition" content="{{ $seo->product['condition'] }}">
            <meta property="product:retailer_item_id" content="{{ $seo->product['retailer_item_id'] }}">
            <meta property="product:brand" content="{{ $seo->product['brand'] }}">
            @if (!empty($seo->product['category']))
                <meta property="product:category" content="{{ $seo->product['category'] }}">
            @endif
            @if (!empty($seo->product['sale_price_amount']))
                <meta property="product:sale_price:amount" content="{{ $seo->product['sale_price_amount'] }}">
                <meta property="product:sale_price:currency" content="{{ $seo->product['price_currency'] }}">
            @endif
            <meta property="og:price:amount" content="{{ $seo->product['price_amount'] }}">
            <meta property="og:price:currency" content="{{ $seo->product['price_currency'] }}">
        @endif

        {{-- Pagination --}}
        @if (!empty($seo->prev))
            <link rel="prev" href="{{ $seo->prev }}">
        @endif
        @if (!empty($seo->next))
            <link rel="next" href="{{ $seo->next }}">
        @endif

        {{-- Hreflang --}}
        <link rel="alternate" hreflang="en-PH" href="{{ $seo->canonical }}">
        <link rel="alternate" hreflang="x-default" href="{{ $seo->canonical }}">

        {{-- JSON-LD --}}
        @if (!empty($seo->jsonLd))
            <script type="application/ld+json">
{!! \App\Support\Schema\SchemaGraph::encode($seo->jsonLd) !!}
            </script>
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

        {{-- Google Analytics 4: public storefront only (not admin, seller, settings or auth pages). --}}
        @php
            $gaId = config('services.google_analytics.measurement_id');
            $gaExcluded = request()->is('admin', 'admin/*', 'seller/*', 'settings/*', 'login', 'register', 'forgot-password', 'reset-password/*', 'two-factor-challenge', 'user/*', 'email/*', 'auth/*');
        @endphp
        @if ($gaId && ! $gaExcluded)
            <script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaId }}"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', @js($gaId));
            </script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $seo->title }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
