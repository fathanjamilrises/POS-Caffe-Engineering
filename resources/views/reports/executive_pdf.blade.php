<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Eksekutif & Laba Rugi - Kasir App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #111;
            margin: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        h1 { margin: 0 0 4px 0; font-size: 20px; color: #1e1b4b; }
        .date { font-size: 11px; color: #666; }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
        }
        .card {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 12px;
            background: #fafafa;
        }
        .card-title { font-size: 10px; text-transform: uppercase; color: #555; margin-bottom: 6px; font-weight: bold; }
        .card-value { font-size: 16px; font-weight: bold; font-family: monospace; color: #111; }
        .profit { color: #047857; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
        }
        th { background: #f0f0f5; font-size: 11px; }
        .text-right { text-align: right; }
        .mono { font-family: monospace; }
        .btn-print {
            padding: 8px 16px;
            background: #4338ca;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 15px;
        }
        @media print {
            .btn-print { display: none; }
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan ke PDF</button>

    <div class="header">
        <div>
            <h1>Laporan Eksekutif & Laba Rugi</h1>
            <div class="date">Waktu Cetak: {{ $generated_at }} | Tanggal Analisis: {{ $summary_metrics['target_date'] }}</div>
        </div>
        <div style="text-align: right;">
            <strong>KASIR & POS SYSTEM</strong><br>
            <span style="color: #666;">Canteen & QR Ordering</span>
        </div>
    </div>

    <div class="bento-grid">
        <div class="card">
            <div class="card-title">Gross Revenue (Omset)</div>
            <div class="card-value">Rp {{ number_format($summary_metrics['gross_revenue'], 0, ',', '.') }}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Tunai: Rp {{ number_format($summary_metrics['cash_revenue'], 0, ',', '.') }} | QRIS: Rp {{ number_format($summary_metrics['qris_revenue'], 0, ',', '.') }}</div>
        </div>
        <div class="card">
            <div class="card-title">Total HPP (Modal)</div>
            <div class="card-value">Rp {{ number_format($summary_metrics['total_cost'], 0, ',', '.') }}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">{{ $summary_metrics['total_orders_count'] }} Transaksi Berhasil</div>
        </div>
        <div class="card">
            <div class="card-title">Biaya Operasional</div>
            <div class="card-value">Rp {{ number_format($summary_metrics['operational_expenses'], 0, ',', '.') }}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Pengeluaran Hari Ini</div>
        </div>
        <div class="card">
            <div class="card-title">Laba Bersih (Net Profit)</div>
            <div class="card-value profit">Rp {{ number_format($summary_metrics['net_profit'], 0, ',', '.') }}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Omset - HPP - Operasional</div>
        </div>
    </div>

    <h3>Riwayat Transaksi Terbaru</h3>
    <table>
        <thead>
            <tr>
                <th>Invoice</th>
                <th>Token</th>
                <th>Sumber</th>
                <th>Kasir</th>
                <th>Metode</th>
                <th class="text-right">Total HPP</th>
                <th class="text-right">Total Penjualan</th>
                <th>Waktu</th>
            </tr>
        </thead>
        <tbody>
            @forelse($recent_orders as $order)
                <tr>
                    <td class="mono">{{ $order->invoice_number }}</td>
                    <td class="mono">#{{ $order->token_number }}</td>
                    <td>{{ $order->order_source === 'qr_table' ? 'QR Meja' : 'Kasir Langsung' }}</td>
                    <td>{{ $order->cashier?->full_name ?? '-' }}</td>
                    <td>{{ strtoupper($order->payment_method) }}</td>
                    <td class="text-right mono">Rp {{ number_format($order->total_cost, 0, ',', '.') }}</td>
                    <td class="text-right mono">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
                    <td>{{ $order->created_at?->format('H:i') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align: center; color: #888;">Belum ada data transaksi hari ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h3>Rekap Shift Kasir</h3>
    <table>
        <thead>
            <tr>
                <th>Shift</th>
                <th>Kasir</th>
                <th>Buka / Tutup</th>
                <th class="text-right">Modal Awal</th>
                <th class="text-right">Total Tunai</th>
                <th class="text-right">Kas Aktual</th>
                <th class="text-right">Selisih</th>
            </tr>
        </thead>
        <tbody>
            @forelse($cashier_shifts as $shift)
                <tr>
                    <td>{{ $shift->shift_name }}</td>
                    <td>{{ $shift->cashier?->full_name ?? '-' }}</td>
                    <td>{{ $shift->opened_at?->format('H:i') }} - {{ $shift->closed_at ? $shift->closed_at->format('H:i') : 'AKTIF' }}</td>
                    <td class="text-right mono">Rp {{ number_format($shift->opening_cash, 0, ',', '.') }}</td>
                    <td class="text-right mono">Rp {{ number_format($shift->total_cash_sales, 0, ',', '.') }}</td>
                    <td class="text-right mono">{{ $shift->closing_cash_actual !== null ? 'Rp ' . number_format($shift->closing_cash_actual, 0, ',', '.') : '-' }}</td>
                    <td class="text-right mono" style="color: {{ ($shift->discrepancy ?? 0) < 0 ? '#b91c1c' : '#047857' }};">
                        {{ $shift->discrepancy !== null ? ($shift->discrepancy >= 0 ? '+' : '') . 'Rp ' . number_format($shift->discrepancy, 0, ',', '.') : '-' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; color: #888;">Belum ada sesi shift tercatat.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

