<?php

namespace App\Models;

use Database\Factories\CashierShiftFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'cashier_id',
    'shift_name',
    'opened_at',
    'closed_at',
    'opening_cash',
    'total_cash_sales',
    'total_qris_sales',
    'closing_cash_actual',
    'notes',
])]
class CashierShift extends Model
{
    /** @use HasFactory<CashierShiftFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_cash' => 'decimal:2',
            'total_cash_sales' => 'decimal:2',
            'total_qris_sales' => 'decimal:2',
            'closing_cash_actual' => 'decimal:2',
        ];
    }

    /**
     * Cashier assigned to this shift.
     *
     * @return BelongsTo<User, $this>
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    /**
     * Orders processed during this shift.
     *
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'shift_id');
    }
}
