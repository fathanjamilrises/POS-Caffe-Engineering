import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Server,
    Database,
    Cpu,
    HardDrive,
    Zap,
    ShieldCheck,
    Wrench,
    FileText,
    RefreshCw,
    Terminal,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Info,
    RotateCcw,
    Lock,
    KeyRound,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Sliders,
    QrCode,
    Sun,
    Moon,
    Laptop,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import { toast } from '@/Services/toast';
import { useTheme } from '@/Hooks/useTheme';

export default function AdminSettings({
    system_info = {},
    database_info = {},
    security_settings = {},
    logs = [],
    total_tables = 0,
}) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('server'); // 'server' | 'optimize' | 'security' | 'maintenance' | 'logs'

    // Security Form State
    const [securityForm, setSecurityForm] = useState({
        qr_auto_rotate_token: security_settings.qr_auto_rotate_token ?? true,
        qr_require_cashier_verification: security_settings.qr_require_cashier_verification ?? false,
        qr_rate_limit_per_minute: security_settings.qr_rate_limit_per_minute ?? 3,
        qr_table_pin_enabled: security_settings.qr_table_pin_enabled ?? false,
        qr_table_pin_code: security_settings.qr_table_pin_code ?? '1234',
    });
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);

    // Maintenance Form State
    const [maintenanceForm, setMaintenanceForm] = useState({
        maintenance_mode: security_settings.maintenance_mode ?? false,
        maintenance_message:
            security_settings.maintenance_message ??
            'Sistem sedang dalam proses pemeliharaan & pengembangan fitur baru. Silakan hubungi kasir/admin.',
    });
    const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

    // Artisan Command Output Modal State
    const [runningCommand, setRunningCommand] = useState(null);
    const [commandOutputModal, setCommandOutputModal] = useState({
        isOpen: false,
        command: '',
        description: '',
        output: '',
        success: true,
    });

    // Confirmation Modals State
    const [showRegenQrModal, setShowRegenQrModal] = useState(false);
    const [showClearLogsModal, setShowClearLogsModal] = useState(false);
    const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
    const [isClearingLogs, setIsClearingLogs] = useState(false);

    // Log Viewer State
    const [logLevelFilter, setLogLevelFilter] = useState('ALL');
    const [logSearchQuery, setLogSearchQuery] = useState('');
    const [expandedLogIndex, setExpandedLogIndex] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Optimization commands list
    const optimizationCommands = [
        {
            key: 'optimize:clear',
            title: 'Bersihkan Seluruh Cache',
            description: 'Menghapus cache konfigurasi, route, view blade, dan cache aplikasi.',
            icon: Trash2,
            badge: 'Paling Sering Digunakan',
        },
        {
            key: 'optimize',
            title: 'Optimasi Cache Produksi',
            description: 'Mengompilasi dan meng-cache konfigurasi serta rute URL untuk performa maksimal.',
            icon: Zap,
            badge: 'Rekomendasi Rilis',
        },
        {
            key: 'storage:link',
            title: 'Hubungkan Storage Publik',
            description: 'Memastikan symbolic link public/storage terhubung untuk gambar menu.',
            icon: HardDrive,
            badge: 'Media Aset',
        },
        {
            key: 'queue:restart',
            title: 'Restart Antrean Background',
            description: 'Me-restart background worker antrean email atau broadcast notifikasi.',
            icon: RotateCcw,
            badge: 'Proses Latar',
        },
    ];

    // Handle Execute Artisan Command
    const handleRunArtisan = (commandKey, description) => {
        setRunningCommand(commandKey);
        router.post(
            '/admin/settings/artisan',
            { command: commandKey },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setRunningCommand(null);
                    const outputData = page.props?.flash?.artisan_output;
                    setCommandOutputModal({
                        isOpen: true,
                        command: commandKey,
                        description: description,
                        output: outputData?.output || 'Perintah selesai dieksekusi dengan sukses.',
                        success: true,
                    });
                    toast.success(`Perintah '${commandKey}' berhasil dieksekusi.`);
                },
                onError: (errors) => {
                    setRunningCommand(null);
                    toast.error('Gagal mengeksekusi perintah optimasi.');
                },
            }
        );
    };

    // Handle Save Security Settings
    const handleSaveSecurity = (e) => {
        e.preventDefault();
        setIsSavingSecurity(true);
        router.post('/admin/settings/security', securityForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingSecurity(false);
                toast.success('Pengaturan keamanan QR Meja berhasil disimpan.');
            },
            onError: () => {
                setIsSavingSecurity(false);
                toast.error('Gagal menyimpan pengaturan keamanan.');
            },
        });
    };

    // Handle Toggle Maintenance Mode
    const handleSaveMaintenance = (e) => {
        e.preventDefault();
        setIsSavingMaintenance(true);
        router.post('/admin/settings/maintenance', maintenanceForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingMaintenance(false);
                toast.success(
                    maintenanceForm.maintenance_mode
                        ? 'Mode pemeliharaan sistem AKTIF.'
                        : 'Mode pemeliharaan DINONAKTIFKAN.'
                );
            },
            onError: () => {
                setIsSavingMaintenance(false);
                toast.error('Gagal memperbarui mode pemeliharaan.');
            },
        });
    };

    // Handle Regenerate All QR Tokens (Master Reset)
    const handleConfirmRegenerateAllQr = () => {
        setIsRegeneratingQr(true);
        router.post(
            '/admin/settings/regenerate-all-qr',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsRegeneratingQr(false);
                    setShowRegenQrModal(false);
                    toast.success('Semua token QR Meja berhasil diganti.');
                },
                onError: () => {
                    setIsRegeneratingQr(false);
                    setShowRegenQrModal(false);
                    toast.error('Gagal memperbarui token QR meja.');
                },
            }
        );
    };

    // Handle Clear Logs
    const handleConfirmClearLogs = () => {
        setIsClearingLogs(true);
        router.post(
            '/admin/settings/clear-logs',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsClearingLogs(false);
                    setShowClearLogsModal(false);
                    toast.success('File log sistem berhasil dibersihkan.');
                },
                onError: () => {
                    setIsClearingLogs(false);
                    setShowClearLogsModal(false);
                    toast.error('Gagal membersihkan file log.');
                },
            }
        );
    };

    // Copy stack trace
    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast.info('Teks log disalin ke clipboard.');
    };

    // Filtered logs
    const filteredLogs = logs.filter((log) => {
        if (logLevelFilter !== 'ALL' && log.level !== logLevelFilter) {
            return false;
        }
        if (logSearchQuery.trim()) {
            const q = logSearchQuery.toLowerCase();
            return (
                log.message.toLowerCase().includes(q) ||
                (log.stack_trace && log.stack_trace.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const errorCount = logs.filter((l) => ['ERROR', 'CRITICAL', 'EMERGENCY'].includes(l.level)).length;
    const warningCount = logs.filter((l) => l.level === 'WARNING').length;

    return (
        <AuthenticatedLayout
            title="Pengaturan Sistem & Server"
            showSearch={false}
            headerRight={
                <div className="flex items-center gap-2">
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        icon={RefreshCw}
                        onClick={() => router.reload()}
                    >
                        <span>Segarkan Status</span>
                    </SpecularButton>
                </div>
            }
        >
            <Head title="Pengaturan Sistem & Server - Admin" />

            <div className="space-y-6">
                {/* ============================================================
                    TOP NAVIGATION TABS (5 KATEGORI PENGATURAN)
                ============================================================ */}
                <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto select-none shadow-sm">
                    {[
                        { id: 'server', label: 'Ringkasan & Server', icon: Server },
                        { id: 'optimize', label: 'Perintah Optimasi', icon: Zap },
                        { id: 'security', label: 'Keamanan QR & Barcode', icon: ShieldCheck },
                        {
                            id: 'maintenance',
                            label: 'Mode Pemeliharaan',
                            icon: Wrench,
                            badge: maintenanceForm.maintenance_mode ? 'AKTIF' : null,
                        },
                        {
                            id: 'logs',
                            label: 'Log Error Sistem',
                            icon: FileText,
                            badge: errorCount > 0 ? `${errorCount} Error` : null,
                            badgeColor: errorCount > 0 ? 'bg-rose-500/20 text-rose-300' : null,
                        },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-b from-[#4338CA] to-[#312E81] text-white border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'
                                        : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                            tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300')
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ============================================================
                    TAB 1: RINGKASAN SERVER & DATABASE
                ============================================================ */}
                {activeTab === 'server' && (
                    <div className="space-y-5">
                        {/* 4 Metric Bento Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Web Server & PHP */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                                        Web Server & Runtime
                                    </span>
                                    <Server className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold font-mono text-white">
                                        PHP {system_info.php_version}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 truncate" title={system_info.server_software}>
                                        {system_info.server_software}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-white/[0.05] text-[11px] font-mono text-slate-500 flex justify-between">
                                    <span>Laravel v{system_info.laravel_version}</span>
                                    <span className="uppercase text-emerald-400">{system_info.environment}</span>
                                </div>
                            </div>

                            {/* Card 2: Database Engine */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                                        Database Engine
                                    </span>
                                    <Database className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold font-mono text-white uppercase">
                                        {database_info.driver}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-mono truncate" title={database_info.database_name}>
                                        {database_info.database_name}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-white/[0.05] text-[11px] font-mono text-slate-500 flex justify-between">
                                    <span>{database_info.tables_count} Tabel</span>
                                    <span>{database_info.size_mb} MB</span>
                                </div>
                            </div>

                            {/* Card 3: Memory Usage */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                                        Penggunaan RAM
                                    </span>
                                    <Cpu className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold font-mono text-white">
                                        {system_info.memory_usage_mb} MB
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Puncak: {system_info.peak_memory_mb} MB
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-white/[0.05] text-[11px] font-mono text-slate-500 flex justify-between">
                                    <span>Driver Cache: {system_info.cache_driver}</span>
                                    <span>Session: {system_info.session_driver}</span>
                                </div>
                            </div>

                            {/* Card 4: Disk Storage */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                                        Penyimpanan Disk
                                    </span>
                                    <HardDrive className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold font-mono text-white">
                                        {system_info.disk_free_gb} GB Bebas
                                    </div>
                                    <div className="mt-2 w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full"
                                            style={{ width: `${system_info.disk_usage_percent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-white/[0.05] text-[11px] font-mono text-slate-500 flex justify-between">
                                    <span>{system_info.disk_usage_percent}% Terpakai</span>
                                    <span>Total: {system_info.disk_total_gb} GB</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Specifications Table */}
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-4 shadow-sm">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-400" />
                                <span>Spesifikasi Lingkungan Sistem Lengkap</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { label: 'Sistem Operasi Host', value: system_info.operating_system },
                                    { label: 'Nama Host Komputer', value: system_info.host_name },
                                    { label: 'Zona Waktu Server', value: system_info.timezone },
                                    { label: 'Versi Database', value: database_info.version },
                                    { label: 'Driver Antrean (Queue)', value: system_info.queue_driver },
                                    {
                                        label: 'Mode Debug Aplikasi',
                                        value: system_info.debug_mode ? 'AKTIF (Development)' : 'NONAKTIF (Production)',
                                        highlight: system_info.debug_mode ? 'text-amber-400' : 'text-emerald-400',
                                    },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-[#06070A] border border-white/[0.06] flex flex-col justify-between"
                                    >
                                        <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
                                        <span
                                            className={`text-xs font-mono font-bold mt-1 truncate ${
                                                item.highlight || 'text-white'
                                            }`}
                                            title={String(item.value)}
                                        >
                                            {String(item.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Theme Mode Selector Card */}
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sun className="w-4 h-4 text-amber-400" />
                                    <span>Pilihan Tema Tampilan (Dark & Light Mode)</span>
                                </h3>
                                <span className="text-xs font-mono text-slate-400">
                                    Aktif: {theme === 'system' ? 'Mengikuti Sistem' : theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                Pilih preferensi visual tampilan aplikasi. Secara default sistem akan mendeteksi pengaturan mode terang/gelap pada perangkat komputer atau tablet Anda secara dinamis.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                {[
                                    {
                                        id: 'system',
                                        title: 'Mengikuti Sistem (Default)',
                                        desc: 'Otomatis berganti terang/gelap sesuai setelan OS Anda.',
                                        icon: Laptop,
                                    },
                                    {
                                        id: 'dark',
                                        title: 'Mode Gelap (Dark)',
                                        desc: 'Nuansa arsitektural Obsidian Ultramarine & Tanzanite.',
                                        icon: Moon,
                                    },
                                    {
                                        id: 'light',
                                        title: 'Mode Terang (Light)',
                                        desc: 'Crisp Alabaster dengan kontras tinggi untuk kantin cerah.',
                                        icon: Sun,
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isSelected = theme === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setTheme(item.id);
                                                toast.success(`Tema diubah ke ${item.title}.`);
                                            }}
                                            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all ${
                                                isSelected
                                                    ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500/50 dark:bg-[#1E1B4B] dark:bg-gradient-to-b dark:from-[#4338CA]/30 dark:to-[#1E1B4B]'
                                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#06070A] dark:border-white/[0.06] dark:hover:border-white/[0.12] dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-white/[0.05] text-slate-400'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                {isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                    {item.title}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 2: PERINTAH OPTIMASI (ARTISAN SHORTCUTS)
                ============================================================ */}
                {activeTab === 'optimize' && (
                    <div className="space-y-5">
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span>Perintah Cepat Optimasi & Pemeliharaan Cache</span>
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Jalankan perintah optimasi resmi Laravel dengan sekali klik. Sangat berguna setelah melakukan pembaruan kode, perubahan rute menu, atau saat website terasa lambat akibat cache lama.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {optimizationCommands.map((cmd) => {
                                const Icon = cmd.icon;
                                const isRunning = runningCommand === cmd.key;
                                return (
                                    <div
                                        key={cmd.key}
                                        className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4 hover:border-white/[0.12] transition-colors"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white">{cmd.title}</h4>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                                                    {cmd.badge}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {cmd.description}
                                            </p>

                                            <div className="text-[11px] font-mono text-slate-500 bg-[#06070A] px-2.5 py-1 rounded border border-white/[0.05]">
                                                $ php artisan {cmd.key}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isRunning}
                                            onClick={() => handleRunArtisan(cmd.key, cmd.title)}
                                            className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                                        >
                                            {isRunning ? (
                                                <>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                                    <span>Mengeksekusi...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span>Jalankan Perintah</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 3: KEAMANAN QR & ANTI-ISENG
                ============================================================ */}
                {activeTab === 'security' && (
                    <div className="space-y-5">
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Pencegahan Kecurangan & Pelanggan Iseng (Anti-Prank)</span>
                                </h3>

                                <SpecularButton
                                    variant="danger"
                                    size="sm"
                                    icon={RotateCcw}
                                    onClick={() => setShowRegenQrModal(true)}
                                >
                                    <span>Regenerasi Semua Token QR Meja</span>
                                </SpecularButton>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Fitur perlindungan aktif untuk menghentikan pelanggan iseng yang memotret QR code meja lalu memesan fiktif dari luar kantin atau memesan makanan berulang kali tanpa membayar.
                            </p>
                        </div>

                        <form onSubmit={handleSaveSecurity} className="space-y-4">
                            {/* Toggle 1: Auto-Rotate Token QR */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-indigo-400" />
                                        <span>Rotasi Otomatis Token QR Meja (Sangat Disarankan)</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                                        Saat pesanan meja selesai disajikan oleh kasir, token QR meja tersebut otomatis diganti dengan token baru yang acak. Foto QR code yang disimpan atau dipotret pelanggan sebelumnya langsung tidak dapat digunakan lagi (HTTP 404).
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={securityForm.qr_auto_rotate_token}
                                        onChange={(e) =>
                                            setSecurityForm({
                                                ...securityForm,
                                                qr_auto_rotate_token: e.target.checked,
                                            })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Toggle 2: Wajib Verifikasi Kasir Sebelum Masuk KDS */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-amber-400" />
                                        <span>Wajib Konfirmasi Kasir Sebelum Dapur Memasak</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                                        Pesanan yang diinput pelanggan lewat QR meja wajib dikonfirmasi/diverifikasi pembayaran oleh kasir terlebih dahulu sebelum tiket diteruskan ke layar koki dapur. Mencegah koki memasak makanan sebelum dipastikan pembeli benar-benar ada di meja.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={securityForm.qr_require_cashier_verification}
                                        onChange={(e) =>
                                            setSecurityForm({
                                                ...securityForm,
                                                qr_require_cashier_verification: e.target.checked,
                                            })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Config 3: Rate Limiter Per Device / IP */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                        <span>Batas Frekuensi Pemesanan (Anti-Spam Flood)</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                                        Membatasi jumlah pengiriman pesanan dari perangkat atau IP yang sama dalam durasi 2 menit untuk mencegah bot atau spam tombol submit.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={securityForm.qr_rate_limit_per_minute}
                                        onChange={(e) =>
                                            setSecurityForm({
                                                ...securityForm,
                                                qr_rate_limit_per_minute: parseInt(e.target.value) || 1,
                                            })
                                        }
                                        className="w-20 h-10 px-3 rounded-lg bg-[#06070A] border border-white/[0.08] text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-xs font-mono text-slate-400">kali / 2 menit</span>
                                </div>
                            </div>

                            {/* Config 4: Table PIN Protection */}
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <KeyRound className="w-4 h-4 text-purple-400" />
                                            <span>Proteksi Kode PIN Meja (Keamanan Fisik Tingkat Lanjut)</span>
                                        </h4>
                                        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                                            Jika diaktifkan, pelanggan yang memindai QR wajib memasukkan kode PIN yang hanya tertera di stiker meja fisik sebelum dapat mengirim pesanan.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={securityForm.qr_table_pin_enabled}
                                            onChange={(e) =>
                                                setSecurityForm({
                                                    ...securityForm,
                                                    qr_table_pin_enabled: e.target.checked,
                                                })
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {securityForm.qr_table_pin_enabled && (
                                    <div className="p-3.5 rounded-lg bg-[#06070A] border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                        <label className="text-xs text-slate-300 font-medium">
                                            Kode PIN Valid Meja:
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="8"
                                            value={securityForm.qr_table_pin_code}
                                            onChange={(e) =>
                                                setSecurityForm({
                                                    ...securityForm,
                                                    qr_table_pin_code: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh: 1234"
                                            className="w-36 h-9 px-3 rounded-md bg-[#0B0D13] border border-white/[0.1] font-mono text-center font-bold tracking-widest text-white text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                        <span className="text-[11px] text-slate-400">
                                            Tempelkan nomor PIN ini pada akrilik meja fisik.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <SpecularButton
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={isSavingSecurity}
                                    icon={ShieldCheck}
                                >
                                    <span>
                                        {isSavingSecurity ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}
                                    </span>
                                </SpecularButton>
                            </div>
                        </form>
                    </div>
                )}

                {/* ============================================================
                    TAB 4: MODE PEMELIHARAAN (MAINTENANCE MODE)
                ============================================================ */}
                {activeTab === 'maintenance' && (
                    <div className="space-y-5">
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-amber-400" />
                                <span>Kontrol Mode Pemeliharaan Sistem (Maintenance)</span>
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Gunakan mode ini saat Anda sedang melakukan pembaruan menu besar-besaran, perbaikan database, atau migrasi sistem. Saat mode ini aktif, pengunjung umum dan kasir akan diarahkan ke halaman pemeliharaan, sementara akun Administrator tetap dapat mengakses seluruh menu dengan normal.
                            </p>
                        </div>

                        <form onSubmit={handleSaveMaintenance} className="space-y-4">
                            <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white">
                                                Status Pemeliharaan Saat Ini:
                                            </h4>
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                                    maintenanceForm.maintenance_mode
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                }`}
                                            >
                                                {maintenanceForm.maintenance_mode ? 'AKTIF (Situs Dikunci)' : 'ONLINE NORMAL'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {maintenanceForm.maintenance_mode
                                                ? 'Sistem terkunci untuk umum. Hanya akun Admin yang dapat login dan mengelola data.'
                                                : 'Sistem beroperasi normal dan dapat diakses oleh kasir, koki dapur, dan pelanggan QR meja.'}
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={maintenanceForm.maintenance_mode}
                                            onChange={(e) =>
                                                setMaintenanceForm({
                                                    ...maintenanceForm,
                                                    maintenance_mode: e.target.checked,
                                                })
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                    </label>
                                </div>

                                <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                                    <label className="text-xs font-semibold text-slate-300">
                                        Pesan Broadcast Pemeliharaan untuk Pengunjung:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={maintenanceForm.maintenance_message}
                                        onChange={(e) =>
                                            setMaintenanceForm({
                                                ...maintenanceForm,
                                                maintenance_message: e.target.value,
                                            })
                                        }
                                        placeholder="Tuliskan alasan pemeliharaan untuk pelanggan..."
                                        className="w-full p-3 rounded-lg bg-[#06070A] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Pesan ini akan ditampilkan di halaman depan saat kasir atau pelanggan mengakses sistem.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <SpecularButton
                                    type="submit"
                                    variant={maintenanceForm.maintenance_mode ? 'danger' : 'primary'}
                                    size="md"
                                    disabled={isSavingMaintenance}
                                    icon={Wrench}
                                >
                                    <span>
                                        {isSavingMaintenance ? 'Menyimpan...' : 'Perbarui Status Pemeliharaan'}
                                    </span>
                                </SpecularButton>
                            </div>
                        </form>
                    </div>
                )}

                {/* ============================================================
                    TAB 5: LOG ERROR & INFORMASI SISTEM
                ============================================================ */}
                {activeTab === 'logs' && (
                    <div className="space-y-5">
                        {/* Toolbar: Level Filter, Search & Clear Log Button */}
                        <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Filter Levels */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                {[
                                    { id: 'ALL', label: 'Semua', count: logs.length },
                                    { id: 'ERROR', label: 'Error', count: errorCount, color: 'text-rose-400' },
                                    { id: 'WARNING', label: 'Warning', count: warningCount, color: 'text-amber-400' },
                                    { id: 'INFO', label: 'Info', count: logs.filter((l) => l.level === 'INFO').length },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setLogLevelFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                            logLevelFilter === tab.id
                                                ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <span className={tab.color}>{tab.label}</span>
                                        <span className="font-mono text-[10px] text-slate-500">({tab.count})</span>
                                    </button>
                                ))}
                            </div>

                            {/* Search & Clear Logs Button */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 sm:w-52">
                                    <input
                                        type="text"
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        placeholder="Cari pesan log..."
                                        className="w-full h-9 pl-3 pr-7 rounded-lg bg-[#06070A] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    {logSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setLogSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>

                                <SpecularButton
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => setShowClearLogsModal(true)}
                                >
                                    <span>Bersihkan Log</span>
                                </SpecularButton>
                            </div>
                        </div>

                        {/* Logs List Container */}
                        {filteredLogs.length === 0 ? (
                            <div className="py-20 text-center bg-[#0B0D13] rounded-xl border border-white/[0.07] p-8 space-y-2">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 opacity-60" />
                                <h4 className="text-sm font-bold text-white">Tidak Ada Log yang Perlu Diperiksa</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    {logSearchQuery
                                        ? `Tidak ada log yang cocok dengan kata kunci "${logSearchQuery}".`
                                        : 'Aplikasi berjalan normal tanpa catatan error yang terdeteksi.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredLogs.map((log, idx) => {
                                    const isExpanded = expandedLogIndex === idx;
                                    const isError = ['ERROR', 'CRITICAL', 'EMERGENCY'].includes(log.level);
                                    const isWarning = log.level === 'WARNING';

                                    return (
                                        <div
                                            key={idx}
                                            className={`rounded-xl border bg-[#0B0D13] overflow-hidden transition-all ${
                                                isError
                                                    ? 'border-rose-500/25 border-l-4 border-l-rose-500'
                                                    : isWarning
                                                    ? 'border-amber-500/25 border-l-4 border-l-amber-400'
                                                    : 'border-white/[0.07] border-l-4 border-l-indigo-400'
                                            }`}
                                        >
                                            {/* Log Summary Header */}
                                            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#06070A]/80">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                                            isError
                                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                                : isWarning
                                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                                        }`}
                                                    >
                                                        {log.level}
                                                    </span>
                                                    <span className="text-xs font-mono text-slate-400">
                                                        {log.timestamp}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                                                        [{log.environment}]
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                `${log.message}\n${log.stack_trace || ''}`,
                                                                idx
                                                            )
                                                        }
                                                        className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center gap-1 transition-colors"
                                                        title="Salin log"
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <Check className="w-3 h-3 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                        <span>Salin</span>
                                                    </button>

                                                    {log.stack_trace && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedLogIndex(isExpanded ? null : idx)
                                                            }
                                                            className="px-2 py-1 rounded text-[11px] font-mono text-indigo-300 hover:text-white hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <span>Tutup Trace</span>
                                                                    <ChevronUp className="w-3 h-3" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>Lihat Trace</span>
                                                                    <ChevronDown className="w-3 h-3" />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Message Content */}
                                            <div className="p-4 font-mono text-xs text-slate-200 leading-relaxed break-words">
                                                {log.message}
                                            </div>

                                            {/* Expandable Stack Trace */}
                                            {isExpanded && log.stack_trace && (
                                                <div className="p-4 bg-black/60 border-t border-white/[0.06] overflow-x-auto">
                                                    <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                                                        {log.stack_trace}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================================
                MODAL 1: OUTPUT EKSEKUSI ARTISAN
            ============================================================ */}
            <AcrylicModal
                isOpen={commandOutputModal.isOpen}
                onClose={() =>
                    setCommandOutputModal({ ...commandOutputModal, isOpen: false })
                }
                title={`Hasil Eksekusi: php artisan ${commandOutputModal.command}`}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                        {commandOutputModal.description}
                    </p>

                    <div className="p-4 rounded-xl bg-black/80 border border-white/[0.08] font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                        {commandOutputModal.output}
                    </div>

                    <div className="flex justify-end pt-2">
                        <SpecularButton
                            variant="primary"
                            size="md"
                            onClick={() =>
                                setCommandOutputModal({ ...commandOutputModal, isOpen: false })
                            }
                        >
                            <span>Tutup</span>
                        </SpecularButton>
                    </div>
                </div>
            </AcrylicModal>

            {/* ============================================================
                MODAL 2: KONFIRMASI REGENERASI SEMUA QR
            ============================================================ */}
            <AcrylicModal
                isOpen={showRegenQrModal}
                onClose={() => setShowRegenQrModal(false)}
                title="Konfirmasi Regenerasi Semua QR Meja"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-xs">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <strong className="font-bold text-rose-300 block">Peringatan Penting:</strong>
                            <p className="leading-relaxed">
                                Tindakan ini akan mengganti token URL seluruh {total_tables} meja makan secara massal. Semua foto atau cetakan QR code lama tidak akan dapat dibuka lagi oleh pelanggan.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                        Gunakan tombol ini jika Anda mencurigai adanya pelanggan yang menyebarkan tautan pemesanan QR ke luar kantin. Anda perlu mencetak ulang atau menampilkan QR code baru setelah proses ini.
                    </p>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowRegenQrModal(false)}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            Batal
                        </button>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            disabled={isRegeneratingQr}
                            onClick={handleConfirmRegenerateAllQr}
                            icon={RotateCcw}
                        >
                            <span>
                                {isRegeneratingQr ? 'Memproses...' : 'Ya, Regenerasi Semua QR'}
                            </span>
                        </SpecularButton>
                    </div>
                </div>
            </AcrylicModal>

            {/* ============================================================
                MODAL 3: KONFIRMASI BERSIHKAN FILE LOG
            ============================================================ */}
            <AcrylicModal
                isOpen={showClearLogsModal}
                onClose={() => setShowClearLogsModal(false)}
                title="Bersihkan Log Error Sistem"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Apakah Anda yakin ingin mengosongkan file <code className="text-indigo-300 font-mono">storage/logs/laravel.log</code>? Seluruh riwayat catatan error sebelumnya akan dihapus secara permanen.
                    </p>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowClearLogsModal(false)}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            Batal
                        </button>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            disabled={isClearingLogs}
                            onClick={handleConfirmClearLogs}
                            icon={Trash2}
                        >
                            <span>{isClearingLogs ? 'Membersihkan...' : 'Ya, Kosongkan Log'}</span>
                        </SpecularButton>
                    </div>
                </div>
            </AcrylicModal>
        </AuthenticatedLayout>
    );
}
