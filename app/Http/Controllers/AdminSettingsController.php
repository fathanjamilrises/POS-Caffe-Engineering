<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use App\Models\SystemSetting;
use App\Services\SystemHealthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        protected SystemHealthService $healthService,
    ) {}

    /**
     * Display the Admin Settings & System Health dashboard.
     */
    public function index(Request $request): Response
    {
        $systemInfo = $this->healthService->getSystemInfo();
        $databaseInfo = $this->healthService->getDatabaseInfo();
        $securitySettings = $this->healthService->getSecuritySettings();
        $logs = $this->healthService->getRecentLogs(60);

        $storeProfile = [
            'store_name' => SystemSetting::get('store_name', 'KASIR CAFE CANTEEN'),
            'store_address' => SystemSetting::get('store_address', 'Jl. R.E. Martadinata No. 42, Ciamis'),
            'store_phone' => SystemSetting::get('store_phone', '0812-3456-7890'),
            'receipt_footer' => SystemSetting::get('receipt_footer', 'Terima Kasih Atas Kunjungan Anda! Harap Simpan Struk Sebagai Bukti Pembayaran Resmi.'),
            'thermal_paper_width' => SystemSetting::get('thermal_paper_width', '58mm'),
        ];

        return Inertia::render('Admin/Settings', [
            'system_info' => $systemInfo,
            'database_info' => $databaseInfo,
            'security_settings' => $securitySettings,
            'store_profile' => $storeProfile,
            'logs' => $logs,
            'total_tables' => DiningTable::count(),
        ]);
    }

    /**
     * Update QR Ordering and Anti-Prank security settings.
     */
    public function updateSecurity(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'qr_auto_rotate_token' => ['required', 'boolean'],
            'qr_require_cashier_verification' => ['required', 'boolean'],
            'qr_rate_limit_per_minute' => ['required', 'integer', 'min:1', 'max:20'],
            'qr_table_pin_enabled' => ['required', 'boolean'],
            'qr_table_pin_code' => ['nullable', 'string', 'max:10'],
        ]);

        SystemSetting::set('qr_auto_rotate_token', $validated['qr_auto_rotate_token'], 'security');
        SystemSetting::set('qr_require_cashier_verification', $validated['qr_require_cashier_verification'], 'security');
        SystemSetting::set('qr_rate_limit_per_minute', $validated['qr_rate_limit_per_minute'], 'security');
        SystemSetting::set('qr_table_pin_enabled', $validated['qr_table_pin_enabled'], 'security');

        if (! empty($validated['qr_table_pin_code'])) {
            SystemSetting::set('qr_table_pin_code', $validated['qr_table_pin_code'], 'security');
        }

        return redirect()->back()->with('success', 'Pengaturan keamanan QR Meja & pencegahan kecurangan berhasil disimpan.');
    }

    /**
     * Toggle Maintenance Mode status and update broadcast message.
     */
    public function toggleMaintenance(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'maintenance_mode' => ['required', 'boolean'],
            'maintenance_message' => ['required', 'string', 'max:500'],
        ]);

        SystemSetting::set('maintenance_mode', $validated['maintenance_mode'], 'system');
        SystemSetting::set('maintenance_message', $validated['maintenance_message'], 'system');

        $statusText = $validated['maintenance_mode'] ? 'DIAKTIFKAN' : 'DINONAKTIFKAN';

        return redirect()->back()->with('success', "Mode pemeliharaan sistem berhasil {$statusText}.");
    }

    /**
     * Run a whitelisted Artisan optimization command.
     */
    public function runArtisan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'command' => ['required', 'string'],
        ]);

        try {
            $result = $this->healthService->runArtisanCommand($validated['command']);

            return redirect()->back()->with([
                'success' => "Perintah '{$validated['command']}' berhasil dijalankan.",
                'artisan_output' => $result,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal menjalankan perintah: ' . $e->getMessage());
        }
    }

    /**
     * Clear application error log file.
     */
    public function clearLogs(): RedirectResponse
    {
        $this->healthService->clearLogFile();

        return redirect()->back()->with('success', 'File log sistem (laravel.log) berhasil dibersihkan.');
    }

    /**
     * 1-Click Regenerate QR Tokens for all dining tables (Anti-Prank Master Reset).
     */
    public function regenerateAllQr(): RedirectResponse
    {
        DB::transaction(function () {
            DiningTable::query()->each(function (DiningTable $table): void {
                $table->update([
                    'qr_code_token' => Str::random(32),
                ]);
            });
        });

        $count = DiningTable::count();

        return redirect()->back()->with('success', "Semua token QR ({$count} meja) berhasil diperbarui. Foto QR lama tidak dapat digunakan lagi.");
    }

    /**
     * Update Store / Cafe identity and thermal printer settings.
     */
    public function updateStoreProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:100'],
            'store_address' => ['required', 'string', 'max:255'],
            'store_phone' => ['required', 'string', 'max:50'],
            'receipt_footer' => ['required', 'string', 'max:255'],
            'thermal_paper_width' => ['required', 'string', 'in:58mm,80mm'],
        ]);

        foreach ($validated as $key => $val) {
            SystemSetting::set($key, $val, 'general');
        }

        return redirect()->back()->with('success', 'Profil kafe & setelan struk termal kasir berhasil disimpan.');
    }

    /**
     * 1-Click Database SQL Backup download.
     */
    public function backupDatabase(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $filename = 'backup_kasir_pos_' . date('Y-m-d_His') . '.sql';

        return response()->streamDownload(function () {
            echo "-- ============================================================\n";
            echo "-- KASIR CAFE POS DATABASE BACKUP\n";
            echo "-- Generated: " . date('Y-m-d H:i:s') . "\n";
            echo "-- ============================================================\n\n";

            $tables = \Illuminate\Support\Facades\Schema::getTableListing();
            foreach ($tables as $table) {
                if (in_array($table, ['sqlite_sequence', 'migrations'])) continue;
                echo "-- Table: {$table}\n";
                $rows = DB::table($table)->get();
                foreach ($rows as $row) {
                    $cols = array_keys((array) $row);
                    $vals = array_map(function ($v) {
                        return is_null($v) ? 'NULL' : "'" . addslashes((string) $v) . "'";
                    }, array_values((array) $row));

                    echo "INSERT INTO `{$table}` (`" . implode('`, `', $cols) . "`) VALUES (" . implode(', ', $vals) . ");\n";
                }
                echo "\n";
            }
        }, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    /**
     * 1-Click Reset / Re-seed Demo Data.
     */
    public function resetDemoData(Request $request): RedirectResponse
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);

            return redirect()->back()->with('success', 'Data demo dan pengaturan standar berhasil diperbarui / di-reset.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal me-reset data: ' . $e->getMessage());
        }
    }
}
