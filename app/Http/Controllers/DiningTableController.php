<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DiningTableController extends Controller
{
    /**
     * Display a listing of dining tables.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiningTable::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $tables = $query->orderBy('table_number')->get();

        return response()->json($tables);
    }

    /**
     * Store a newly created dining table in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_number' => ['required', 'string', 'max:20', 'unique:dining_tables,table_number'],
            'qr_code_token' => ['nullable', 'string', 'max:255', 'unique:dining_tables,qr_code_token'],
            'status' => ['nullable', 'string', Rule::in(['available', 'occupied'])],
        ]);

        if (empty($validated['qr_code_token'])) {
            $validated['qr_code_token'] = Str::random(32);
        }

        $table = DiningTable::create($validated);

        return response()->json([
            'message' => 'Meja makan berhasil ditambahkan',
            'data' => $table,
        ], 201);
    }

    /**
     * Display the specified dining table.
     */
    public function show(DiningTable $diningTable): JsonResponse
    {
        $diningTable->load(['orders' => function ($query): void {
            $query->whereIn('order_status', ['pending', 'confirmed', 'processing', 'ready'])
                ->latest();
        }]);

        return response()->json($diningTable);
    }

    /**
     * Update the specified dining table in storage.
     */
    public function update(Request $request, DiningTable $diningTable): JsonResponse
    {
        $validated = $request->validate([
            'table_number' => ['sometimes', 'string', 'max:20', Rule::unique('dining_tables', 'table_number')->ignore($diningTable->id)],
            'status' => ['sometimes', 'string', Rule::in(['available', 'occupied'])],
        ]);

        $diningTable->update($validated);

        return response()->json([
            'message' => 'Data meja berhasil diperbarui',
            'data' => $diningTable,
        ]);
    }

    /**
     * Regenerate QR code token for table.
     */
    public function regenerateQrToken(DiningTable $diningTable): JsonResponse
    {
        $diningTable->update([
            'qr_code_token' => Str::random(32),
        ]);

        return response()->json([
            'message' => 'Token QR Code berhasil diperbarui',
            'data' => $diningTable,
        ]);
    }

    /**
     * Remove the specified dining table from storage.
     */
    public function destroy(DiningTable $diningTable): JsonResponse
    {
        $diningTable->delete();

        return response()->json([
            'message' => 'Meja makan berhasil dihapus',
        ]);
    }
}
