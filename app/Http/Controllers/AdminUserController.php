<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminUserController extends Controller
{
    /**
     * Display a listing of system users.
     */
    public function index(Request $request): InertiaResponse
    {
        $search = trim((string) $request->input('search', ''));
        $roleFilter = $request->input('role', 'all');
        $statusFilter = $request->input('status', 'all');

        $query = User::withCount(['cashierShifts', 'stockMovements'])->latest();

        if ($search) {
            $query->where(function ($q) use ($search): void {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($roleFilter && $roleFilter !== 'all') {
            $query->where('role', $roleFilter);
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $isActive = $statusFilter === 'active';
            $query->where('is_active', $isActive);
        }

        $users = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_users' => User::count(),
            'admin_count' => User::where('role', 'admin')->count(),
            'kasir_count' => User::where('role', 'kasir')->count(),
            'dapur_count' => User::where('role', 'dapur')->count(),
            'active_count' => User::where('is_active', true)->count(),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:users,username'],
            'role' => ['required', 'string', Rule::in(['admin', 'kasir', 'dapur'])],
            'password' => ['required', 'string', 'min:6'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($validated): void {
            User::create([
                'full_name' => $validated['full_name'],
                'username' => strtolower($validated['username']),
                'role' => $validated['role'],
                'password_hash' => Hash::make($validated['password']),
                'is_active' => $validated['is_active'],
            ]);
        });

        return redirect()->back()->with('success', "Pengguna baru '{$validated['full_name']}' (@{$validated['username']}) berhasil ditambahkan.");
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('users', 'username')->ignore($user->id)],
            'role' => ['required', 'string', Rule::in(['admin', 'kasir', 'dapur'])],
            'password' => ['nullable', 'string', 'min:6'],
            'is_active' => ['required', 'boolean'],
        ]);

        // Prevent self-lockout if updating currently authenticated user
        if ($request->user()?->id === $user->id) {
            $validated['is_active'] = true;
            $validated['role'] = 'admin';
        }

        DB::transaction(function () use ($user, $validated): void {
            $payload = [
                'full_name' => $validated['full_name'],
                'username' => strtolower($validated['username']),
                'role' => $validated['role'],
                'is_active' => $validated['is_active'],
            ];

            if (! empty($validated['password'])) {
                $payload['password_hash'] = Hash::make($validated['password']);
            }

            $user->update($payload);
        });

        return redirect()->back()->with('success', "Data pengguna '{$user->full_name}' berhasil diperbarui.");
    }

    /**
     * Delete the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $name = $user->full_name;
        $user->delete();

        return redirect()->back()->with('success', "Pengguna '{$name}' berhasil dihapus.");
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return redirect()->back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $newStatus = ! $user->is_active;
        $user->update(['is_active' => $newStatus]);

        $statusLabel = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status akun '{$user->full_name}' berhasil {$statusLabel}.");
    }
}

