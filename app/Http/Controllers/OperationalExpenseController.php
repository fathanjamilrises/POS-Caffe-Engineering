<?php

namespace App\Http\Controllers;

use App\Models\OperationalExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OperationalExpenseController extends Controller
{
    /**
     * Display a listing of operational expenses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OperationalExpense::with('user');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [$request->input('start_date'), $request->input('end_date')]);
        } elseif ($request->filled('expense_date')) {
            $query->where('expense_date', $request->input('expense_date'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $expenses = $query->latest('expense_date')->paginate(15);

        return response()->json($expenses);
    }

    /**
     * Store a newly created operational expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'expense_name' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $expense = OperationalExpense::create($validated);

        return response()->json([
            'message' => 'Biaya operasional berhasil dicatat',
            'data' => $expense->load('user'),
        ], 201);
    }

    /**
     * Display the specified operational expense.
     */
    public function show(OperationalExpense $operationalExpense): JsonResponse
    {
        $operationalExpense->load('user');

        return response()->json($operationalExpense);
    }

    /**
     * Update the specified operational expense.
     */
    public function update(Request $request, OperationalExpense $operationalExpense): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'exists:users,id'],
            'expense_name' => ['sometimes', 'string', 'max:150'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'expense_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $operationalExpense->update($validated);

        return response()->json([
            'message' => 'Biaya operasional berhasil diperbarui',
            'data' => $operationalExpense->fresh()->load('user'),
        ]);
    }

    /**
     * Remove the specified operational expense.
     */
    public function destroy(OperationalExpense $operationalExpense): JsonResponse
    {
        $operationalExpense->delete();

        return response()->json([
            'message' => 'Biaya operasional berhasil dihapus',
        ]);
    }

    /**
     * Summary of operational expenses for Profit & Loss calculation.
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $totalAmount = OperationalExpense::whereBetween('expense_date', [
            $request->input('start_date'),
            $request->input('end_date'),
        ])->sum('amount');

        return response()->json([
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'total_expense' => (float) $totalAmount,
        ]);
    }
}
