<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request and ensure the user possesses the required role(s).
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'))->with('error', 'Silakan login terlebih dahulu.');
        }

        if (! empty($roles) && ! in_array($user->role, $roles, true)) {
            // If user is admin, allow access to all areas
            if ($user->role === 'admin') {
                return $next($request);
            }

            abort(403, 'Akses ditolak. Halaman ini hanya untuk peran: '.implode(', ', $roles));
        }

        return $next($request);
    }
}
