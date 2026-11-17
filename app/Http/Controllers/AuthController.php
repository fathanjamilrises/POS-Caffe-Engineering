<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectBasedOnRole(Auth::user());
        }

        return Inertia::render('Auth/Login', [
            'demo_accounts' => [
                ['role' => 'admin', 'username' => 'admin', 'name' => 'Administrator', 'badge' => 'Admin Full Access'],
                ['role' => 'kasir', 'username' => 'kasir1', 'name' => 'Kasir Utama', 'badge' => 'POS Cashier'],
                ['role' => 'dapur', 'username' => 'chef1', 'name' => 'Chef Dapur', 'badge' => 'Kitchen KDS'],
            ],
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', $validated['username'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'username' => 'Kombinasi username atau password tidak cocok.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => 'Akun Anda dinonaktifkan. Hubungi administrator.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return $this->redirectBasedOnRole($user)
            ->with('success', "Selamat datang kembali, {$user->full_name} ({$user->role})!");
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Anda telah berhasil logout.');
    }

    /**
     * Update current authenticated user's profile and password.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'current_password' => ['nullable', 'string', 'required_with:new_password'],
            'new_password' => ['nullable', 'string', 'min:6'],
        ]);

        if (! empty($validated['new_password'])) {
            if (! Hash::check($validated['current_password'] ?? '', $user->password_hash)) {
                throw ValidationException::withMessages([
                    'current_password' => 'Password lama yang Anda masukkan tidak sesuai.',
                ]);
            }

            $user->password_hash = Hash::make($validated['new_password']);
        }

        $user->full_name = $validated['full_name'];
        $user->save();

        return redirect()->back()->with('success', 'Profil dan kredensial akun berhasil diperbarui.');
    }

    /**
     * Redirect user to their respective home dashboard based on role.
     */
    protected function redirectBasedOnRole(User $user): RedirectResponse
    {
        return match ($user->role) {
            'kasir' => redirect()->route('cashier.pos'),
            'dapur' => redirect()->route('kitchen.display'),
            default => redirect()->route('admin.dashboard'),
        };
    }
}
