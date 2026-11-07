<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="color-scheme" content="light dark">

        <title inertia>{{ config('app.name', 'Kasir BK - Admin & POS') }}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

        <script>
            // Anti-FOUC theme initialization: Defaults to system preference
            (function() {
                try {
                    var saved = localStorage.getItem('app_theme') || 'system';
                    var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    var root = document.documentElement;
                    if (isDark) {
                        root.classList.add('dark');
                        root.classList.remove('light');
                        root.setAttribute('data-theme', 'dark');
                    } else {
                        root.classList.add('light');
                        root.classList.remove('dark');
                        root.setAttribute('data-theme', 'light');
                    }
                    root.setAttribute('data-theme-preference', saved);
                } catch (e) {}
            })();

            // Unregister any lingering legacy/zombie service workers on localhost/127.0.0.1
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                });
            }
        </script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#07080D] text-slate-100 min-h-screen overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
        @inertia
    </body>
</html>

