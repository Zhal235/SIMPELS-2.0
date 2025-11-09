{{--
  Production Prep: Base Layout (Tailwind + Vite)
  ------------------------------------------------
  CHANGE LOG:
  - Introduces a reusable, responsive base layout using TailwindCSS and Vite.
  - Keeps business logic, routes, and event handlers unchanged.
  - Ensures consistent spacing and typography across pages.
  - Safe to adopt incrementally: existing views (like welcome) remain intact.
--}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Laravel') }}</title>

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    {{-- Styles / Scripts via Vite --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
  </head>
  <body class="min-h-screen bg-white text-gray-900 font-sans">
    <header class="container-app mx-auto py-4 flex items-center justify-between">
      <a href="{{ url('/') }}" class="inline-flex items-center gap-2 font-semibold">
        <svg class="size-6 text-gray-800" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19.5V4.5L18 12L6 19.5Z" fill="currentColor"/></svg>
        <span>{{ config('app.name') }}</span>
      </a>
      <nav class="hidden md:flex items-center gap-4">
        {{-- Placeholder links for future pages; keep routes unchanged --}}
        <a href="#" class="text-sm text-gray-600 hover:text-gray-900">Docs</a>
        <a href="#" class="text-sm text-gray-600 hover:text-gray-900">Status</a>
      </nav>
    </header>

    <main class="container-app mx-auto py-6">
      {{ $slot ?? '' }}
      @yield('content')
    </main>

    <footer class="container-app mx-auto py-6 text-sm text-gray-500">
      <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </footer>
  </body>
</html>