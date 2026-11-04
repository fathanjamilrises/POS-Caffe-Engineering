<?php

namespace App\Http\Controllers;

use App\Models\CashierShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashierShiftController extends Controller
{
    /**
     * Display a listing of cashier shifts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashierShift::with('cashier');

        if ($request->filled('cashier_id')) {
            $query->where('cashier_id', $request->input('cashier_id'));
        }

        if ($request->has('is_open')) {
            if ($request->boolean('is_open')) {
                $query->whereNull('closed_at');
            } else {
                $query->whereNotNull('closed_at');
            }
        }

        $shifts = $query->latest('opened_at')->paginate(15);

        return response()->json($shifts);
    }

    /**
     * Open a new cashier shift.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cashier_id' => ['required', 'exists:users,id'],
            'shift_name' => ['required', 'string', 'max:50'],
            'opening_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $activeShift = CashierShift::where('cashier_id', $validated['cashier_id'])
            ->whereNull('closed_at')
            ->first();

        if ($activeShift) {
            return response()->json([
                'message' => 'Kasir masih memiliki shift aktif yang belum ditutup.',
                'data' => $activeShift,
            ], 422);
        }

        $shift = CashierShift::create([
            'cashier_id' => $validated['cashier_id'],
            'shift_name' => $validated['shift_name'],
            'opened_at' => now(),
            'opening_cash' => $validated['opening_cash'],
            'total_cash_sales' => 0,
            'total_qris_sales' => 0,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Shift kasir berhasil dibuka',
            'data' => $shift->load('cashier'),
        ], 201);
    }

    /**
     * Display the specified cashier shift with sales recap.
     */
    public function show(CashierShift $cashierShift): JsonResponse
    {
        $cashierShift->load(['cashier', 'orders']);

        $totalCash = $cashierShift->orders()
            ->where('payment_status', 'paid')
            ->where('payment_method', 'tunai')
            ->sum('total_amount');

        $totalQris = $cashierShift->orders()
            ->where('payment_status', 'paid')
            ->where('payment_method', 'qris')
            ->sum('total_amount');

        $expectedEndingCash = (float) $cashierShift->opening_cash + (float) $totalCash;

        return response()->json([
            'shift' => $cashierShift,
            'calculated_totals' => [
                'total_cash_sales' => $totalCash,
                'total_qris_sales' => $totalQris,
                'expected_cash_in_drawer' => $expectedEndingCash,
                'discrepancy' => $cashierShift->closing_cash_actual !== null
                    ? (float) $cashierShift->closing_cash_actual - $expectedEndingCash
                    : null,
            ],
        ]);
    }

    /**
     * Close an active cashier shift and record actual cash.
     */
    public function closeShift(Request $request, CashierShift $cashierShift): JsonResponse
    {
        if ($cashierShift->closed_at !== null) {
            return response()->json([
                'message' => 'Shift ini sudah ditutup sebelumnya.',
            ], 422);
        }

        $validated = $request->validate([
            'closing_cash_actual' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $totalCash = $cashierShift->orders()
            ->where('payment_status', 'paid')
            ->where('payment_method', 'tunai')
            ->sum('total_amount');

        $totalQris = $cashierShift->orders()
            ->where('payment_status', 'paid')
            ->where('payment_method', 'qris')
            ->sum('total_amount');

        $cashierShift->update([
            'closed_at' => now(),
            'total_cash_sales' => $totalCash,
            'total_qris_sales' => $totalQris,
            'closing_cash_actual' => $validated['closing_cash_actual'],
            'notes' => $validated['notes'] ?? $cashierShift->notes,
        ]);

        $expectedCash = (float) $cashierShift->opening_cash + (float) $totalCash;
        $selisih = (float) $validated['closing_cash_actual'] - $expectedCash;

        return response()->json([
            'message' => 'Shift kasir berhasil ditutup',
            'data' => $cashierShift->fresh()->load('cashier'),
            'recap' => [
                'opening_cash' => (float) $cashierShift->opening_cash,
                'total_cash_sales' => (float) $totalCash,
                'total_qris_sales' => (float) $totalQris,
                'expected_cash' => $expectedCash,
                'actual_cash' => (float) $validated['closing_cash_actual'],
                'difference' => $selisih,
            ],
        ]);
    }
}
