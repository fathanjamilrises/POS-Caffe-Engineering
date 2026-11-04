<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TableManagementController extends Controller
{
    /**
     * Display all dining tables with QR codes and active orders.
     */
    public function index(): Response
    {
        $tables = DiningTable::withCount(['orders' => function ($q): void {
            $q->whereIn('order_status', ['pending', 'processing', 'ready']);
        }])
            ->with(['orders' => function ($q): void {
                $q->latest()->limit(1);
            }])
            ->orderBy('table_number')
            ->get();

        return Inertia::render('Tables/Index', [
            'tables' => $tables,
        ]);
    }

    /**
     * Store a newly created dining table.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'table_number' => ['required', 'string', 'max:20', 'unique:dining_tables,table_number'],
        ]);

        DiningTable::create([
            'table_number' => $validated['table_number'],
            'qr_code_token' => Str::random(32),
            'status' => 'available',
        ]);

        return redirect()->back()->with('success', "Meja '{$validated['table_number']}' berhasil ditambahkan.");
    }

    /**
     * Update table status (available, occupied).
     */
    public function updateStatus(Request $request, DiningTable $diningTable): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:available,occupied'],
        ]);

        $diningTable->update($validated);

        return redirect()->back()->with('success', "Status {$diningTable->table_number} diubah menjadi {$validated['status']}.");
    }

    /**
     * Regenerate QR code token for a table.
     */
    public function regenerateQr(DiningTable $diningTable): RedirectResponse
    {
        $diningTable->update([
            'qr_code_token' => Str::random(32),
        ]);

        return redirect()->back()->with('success', "Token QR Code untuk {$diningTable->table_number} berhasil diperbarui.");
    }

    /**
     * Remove the specified table.
     */
    public function destroy(DiningTable $diningTable): RedirectResponse
    {
        $number = $diningTable->table_number;
        $diningTable->delete();

        return redirect()->back()->with('success', "Meja {$number} berhasil dihapus.");
    }
}
