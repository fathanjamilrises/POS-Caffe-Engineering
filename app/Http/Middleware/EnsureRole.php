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
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Akses ditolak. Fitur ini hanya untuk peran: '.implode(', ', $roles),
                ], 403);
            }

            // Redirect based on user role to their dedicated area
            if ($user->role === 'admin') {
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Layar operasional Kasir dan Dapur dipisahkan khusus untuk staf operasional.');
            }

            if ($user->role === 'kasir') {
                return redirect()->route('cashier.pos')
                    ->with('error', 'Akses ditolak: Menu administrasi hanya dapat diakses oleh Admin.');
            }

            if ($user->role === 'dapur') {
                return redirect()->route('kitchen.display')
                    ->with('error', 'Akses ditolak: Menu administrasi hanya dapat diakses oleh Admin.');
            }

            abort(403, 'Akses ditolak. Halaman ini hanya untuk peran: '.implode(', ', $roles));
        }

        return $next($request);
    }
}
