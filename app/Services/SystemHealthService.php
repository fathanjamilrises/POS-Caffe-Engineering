<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SystemHealthService
{
    /**
     * Whitelist of safe artisan optimization commands.
     *
     * @var array<string, string>
     */
    protected array $allowedCommands = [
        'optimize:clear' => 'Bersihkan Cache (Route, Config, View, Events)',
        'optimize' => 'Optimasi Cache untuk Kecepatan Produksi',
        'config:cache' => 'Cache Konfigurasi Aplikasi',
        'route:cache' => 'Cache Routing URL',
        'view:cache' => 'Kompilasi & Cache View Blade/Inertia',
        'storage:link' => 'Buat Symlink Storage Publik',
        'queue:restart' => 'Restart Worker Antrean Latar Belakang',
    ];

    /**
     * Get system and server diagnostic information.
     *
     * @return array<string, mixed>
     */
    public function getSystemInfo(): array
    {
        $memoryUsage = memory_get_usage(true);
        $peakMemory = memory_get_peak_usage(true);

        $diskTotal = @disk_total_space(base_path()) ?: 0;
        $diskFree = @disk_free_space(base_path()) ?: 0;
        $diskUsed = max(0, $diskTotal - $diskFree);
        $diskUsagePercent = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? (PHP_SAPI === 'cli-server' ? 'PHP Development Server' : PHP_SAPI),
            'operating_system' => php_uname('s') . ' ' . php_uname('r') . ' (' . php_uname('m') . ')',
            'host_name' => gethostname() ?: 'localhost',
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'memory_usage_mb' => round($memoryUsage / (1024 * 1024), 2),
            'peak_memory_mb' => round($peakMemory / (1024 * 1024), 2),
            'disk_total_gb' => round($diskTotal / (1024 * 1024 * 1024), 2),
            'disk_free_gb' => round($diskFree / (1024 * 1024 * 1024), 2),
            'disk_used_gb' => round($diskUsed / (1024 * 1024 * 1024), 2),
            'disk_usage_percent' => $diskUsagePercent,
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
            'queue_driver' => config('queue.default'),
        ];
    }

    /**
     * Get database metrics and statistics.
     *
     * @return array<string, mixed>
     */
    public function getDatabaseInfo(): array
    {
        $connection = config('database.default');
        $databaseName = DB::connection()->getDatabaseName();

        $tableCount = 0;
        $dbVersion = 'Unknown';
        $dbSizeMb = 0;

        try {
            if ($connection === 'mysql') {
                $versionResult = DB::select('SELECT VERSION() as version');
                $dbVersion = $versionResult[0]->version ?? 'MySQL';

                $tables = DB::select('SHOW TABLES');
                $tableCount = count($tables);

                $sizeResult = DB::select("
                    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb 
                    FROM information_schema.tables 
                    WHERE table_schema = ?
                ", [$databaseName]);

                $dbSizeMb = (float) ($sizeResult[0]->size_mb ?? 0);
            } elseif ($connection === 'sqlite') {
                $dbVersion = 'SQLite ' . (DB::select('SELECT sqlite_version() as version')[0]->version ?? '');
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                $tableCount = count($tables);

                if (file_exists($databaseName)) {
                    $dbSizeMb = round(filesize($databaseName) / (1024 * 1024), 2);
                }
            }
        } catch (\Throwable $e) {
            $dbVersion = 'Error connecting: ' . $e->getMessage();
        }

        return [
            'driver' => $connection,
            'database_name' => $databaseName,
            'version' => $dbVersion,
            'tables_count' => $tableCount,
            'size_mb' => $dbSizeMb,
        ];
    }

    /**
     * Read and parse recent application log entries from storage/logs/laravel.log.
     *
     * @param  int  $limit
     * @return array<int, array<string, mixed>>
     */
    public function getRecentLogs(int $limit = 50): array
    {
        $logPath = storage_path('logs/laravel.log');
        if (! File::exists($logPath)) {
            return [];
        }

        $content = File::get($logPath);
        if (empty(trim($content))) {
            return [];
        }

        // Split log entries by timestamp pattern e.g. [2026-11-07 13:20:15]
        $pattern = '/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] ([a-zA-Z0-9_-]+)\.([A-Z]+): (.*?)(?=(?:^\[\d{4}-\d{2}-\d{2})|\z)/ms';

        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        $parsed = [];
        // Traverse in reverse order (newest first)
        $matches = array_reverse($matches);

        foreach (array_slice($matches, 0, $limit) as $match) {
            $timestamp = $match[1];
            $env = $match[2];
            $level = strtoupper($match[3]);
            $body = trim($match[4]);

            // Separate first message line from stack trace
            $lines = explode("\n", $body, 2);
            $message = $lines[0] ?? '';
            $stackTrace = $lines[1] ?? null;

            $parsed[] = [
                'timestamp' => $timestamp,
                'environment' => $env,
                'level' => $level,
                'message' => $message,
                'stack_trace' => $stackTrace,
            ];
        }

        return $parsed;
    }

    /**
     * Truncate the application log file.
     */
    public function clearLogFile(): bool
    {
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            return File::put($logPath, '') !== false;
        }

        return true;
    }

    /**
     * Run a whitelisted Artisan optimization command and capture output.
     *
     * @return array{success: bool, command: string, description: string, output: string}
     */
    public function runArtisanCommand(string $command): array
    {
        if (! array_key_exists($command, $this->allowedCommands)) {
            throw new \InvalidArgumentException("Perintah '{$command}' tidak diizinkan untuk alasan keamanan.");
        }

        $exitCode = Artisan::call($command);
        $output = Artisan::output();

        return [
            'success' => $exitCode === 0,
            'command' => $command,
            'description' => $this->allowedCommands[$command],
            'output' => trim($output) ?: 'Perintah selesai tanpa pesan.',
        ];
    }

    /**
     * Get security and QR configuration settings.
     *
     * @return array<string, mixed>
     */
    public function getSecuritySettings(): array
    {
        return [
            'qr_auto_rotate_token' => (bool) SystemSetting::get('qr_auto_rotate_token', true),
            'qr_require_cashier_verification' => (bool) SystemSetting::get('qr_require_cashier_verification', false),
            'qr_rate_limit_per_minute' => (int) SystemSetting::get('qr_rate_limit_per_minute', 3),
            'qr_table_pin_enabled' => (bool) SystemSetting::get('qr_table_pin_enabled', false),
            'qr_table_pin_code' => (string) SystemSetting::get('qr_table_pin_code', '1234'),
            'maintenance_mode' => (bool) SystemSetting::get('maintenance_mode', false),
            'maintenance_message' => (string) SystemSetting::get('maintenance_message', 'Sistem sedang dalam proses pemeliharaan & pengembangan fitur baru. Silakan hubungi kasir/admin.'),
        ];
    }
}
