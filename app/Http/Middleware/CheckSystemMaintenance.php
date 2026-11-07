<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSystemMaintenance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isMaintenance = (bool) SystemSetting::get('maintenance_mode', false);

        if (! $isMaintenance) {
            return $next($request);
        }

        // Allow authenticated admin users to bypass maintenance
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }

        // Allow login/logout routes so admin can authenticate
        if ($request->is('login') || $request->is('logout')) {
            return $next($request);
        }

        $message = SystemSetting::get(
            'maintenance_message',
            'Sistem sedang dalam proses pemeliharaan & pengembangan fitur baru. Silakan hubungi kasir/admin.'
        );

        abort(503, $message);
    }
}
