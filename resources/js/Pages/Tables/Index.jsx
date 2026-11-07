import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import QRCode from 'qrcode';
import {
    QrCode,
    Plus,
    Printer,
    ExternalLink,
    RefreshCw,
    Trash2,
    CheckCircle2,
    Users,
    Utensils,
    Copy,
    Check,
    Search,
    Clock,
    Sparkles,
    AlertTriangle,
    AlertCircle,
    X,
    LayoutGrid,
    List,
    RotateCcw,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * TablesIndex: Elevated Table & QR Self-Ordering Management screen.
 * Tuned specifically for cafe/canteen staff aged 40–60 using tablet POS:
 * - Generous 44px–52px touch targets for effortless finger interaction.
 * - Architectural Obsidian Ultramarine & Tanzanite palette (anti-slop, no neon glows).
 * - High-contrast typography with bold monospace numbers for table IDs, tokens, and active orders.
 * - Simple, tactile status toggling (Tersedia / Terisi) directly from the card.
 * - 1-click printable tent card preview with clean printing stylesheet.
 */
export default function TablesIndex({ tables = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [qrImages, setQrImages] = useState({});
    const [copiedToken, setCopiedToken] = useState(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [printModalTable, setPrintModalTable] = useState(null);
    const [regenerateModalTable, setRegenerateModalTable] = useState(null);
    const [deleteModalTable, setDeleteModalTable] = useState(null);

    // Form for adding table
    const { data, setData, post, processing, errors, reset } = useForm({
        table_number: '',
    });

    // Generate QR codes for all tables in memory
    useEffect(() => {
        let isMounted = true;
        const generateAllQr = async () => {
            const map = {};
            for (const table of tables) {
                const customerUrl = `${window.location.origin}/table/${table.qr_code_token}`;
                try {
                    const dataUrl = await QRCode.toDataURL(customerUrl, {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#0B0F19',
                            light: '#FFFFFF',
                        },
                    });
                    map[table.id] = dataUrl;
                } catch (err) {
                    console.error('QR code generation error:', err);
                }
            }
            if (isMounted) {
                setQrImages(map);
            }
        };

        generateAllQr();
        return () => {
            isMounted = false;
        };
    }, [tables]);

    // Handle adding table
    const handleAddTable = (e) => {
        if (e) e.preventDefault();
        post('/tables', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    // Handle toggle status (Tersedia vs Terisi)
    const handleToggleStatus = (table) => {
        const newStatus = table.status === 'available' ? 'occupied' : 'available';
        router.patch(
            `/tables/${table.id}/status`,
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    // Handle regenerate QR token via modal confirmation
    const handleConfirmRegenerateQr = () => {
        if (!regenerateModalTable) return;
        router.post(
            `/tables/${regenerateModalTable.id}/regenerate-qr`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setRegenerateModalTable(null),
            }
        );
    };

    // Handle delete table via modal confirmation
    const handleConfirmDelete = () => {
        if (!deleteModalTable) return;
        router.delete(`/tables/${deleteModalTable.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteModalTable(null),
        });
    };

    // Copy URL helper with visual feedback
    const handleCopyUrl = (table) => {
        const url = `${window.location.origin}/table/${table.qr_code_token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(table.id);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    // Filtered tables
    const filteredTables = tables.filter((table) => {
        const matchesQuery = table.table_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim());
        const matchesStatus =
            statusFilter === 'all' || table.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // Summary metrics
    const totalTables = tables.length;
    const availableTables = tables.filter((t) => t.status === 'available').length;
    const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
    const activeOrdersCount = tables.reduce((acc, t) => acc + (t.orders_count || 0), 0);

    const isFilterActive = Boolean(searchQuery) || statusFilter !== 'all';

    const handleResetFilter = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    return (
        <AuthenticatedLayout
            title="Meja & QR"
            showSearch={false}
        >
            <Head title="Manajemen Meja & QR Ordering" />

            <div className="space-y-6">
                {/* ============================================================
                    1. HEADER CARD & ACTION CONTROLS (HIGH ERGONOMICS FOR TABLET)
                ============================================================ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm">
                    {/* Left: Icon Badge & Descriptive Title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4338CA] via-[#3730A3] to-[#1E1B4B] flex items-center justify-center border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shrink-0">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate">
                                Manajemen Meja & QR Pelanggan
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium truncate mt-0.5">
                                Pantau keterisian meja makan, cetak kartu tenda QR, dan kontrol pemesanan mandiri.
                            </p>
                        </div>
                    </div>

                    {/* Right: Tactile Action Buttons (Min 44px Height for Finger Tapping) */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <SpecularButton
                            size="md"
                            variant="primary"
                            icon={Plus}
                            onClick={() => setIsAddModalOpen(true)}
                            title="Tambah Meja Baru ke Ruangan"
                        >
                            <span>Tambah Meja</span>
                        </SpecularButton>
                    </div>
                </div>

                {/* ============================================================
                    2. METRIC CARDS — TABLE OCCUPANCY & FLOW
                ============================================================ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Meja */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Total Meja
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Utensils className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
                                {totalTables}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Kapasitas meja makan terdaftar</span>
                        </div>
                    </div>

                    {/* Card 2: Meja Tersedia */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Meja Tersedia
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {availableTables}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Status Meja:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Kosong & Bersih</span>
                        </div>
                    </div>

                    {/* Card 3: Meja Terisi */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Meja Terisi
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 tracking-tight">
                                {occupiedTables}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Status Meja:</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">Tamu Duduk</span>
                        </div>
                    </div>

                    {/* Card 4: Pesanan Meja Aktif */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Pesanan Aktif
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
                                {activeOrdersCount}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Antrean:</span>
                            <span className="text-indigo-600 dark:text-indigo-300 font-semibold font-mono">Dapur & Kasir</span>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    3. FILTER & PENCARIAN (ERGONOMIS DENGAN TOUCH TARGET BESAR)
                ============================================================ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search Input with Clear Button */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor meja (cth: Meja 1, VIP 2)..."
                            className="w-full h-11 bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 rounded-xl pl-10 pr-9 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
                                title="Hapus pencarian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Controls: Status Tabs, View Switcher, & Reset */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter Tabs (Large 42px touch targets) */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-xl">
                            {[
                                { id: 'all', label: `Semua (${totalTables})` },
                                { id: 'available', label: `Tersedia (${availableTables})` },
                                { id: 'occupied', label: `Terisi (${occupiedTables})` },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`min-h-[42px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                                        statusFilter === tab.id
                                            ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* View Mode Switcher (Grid vs List Barcode) */}
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-xl">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`min-h-[42px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-white/[0.1] dark:text-white'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                                title="Tampilan Kartu QR Meja"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Kartu QR</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`min-h-[42px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-white/[0.1] dark:text-white'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                                title="Tampilan Tabel List Barcode"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">List Tabel</span>
                            </button>
                        </div>

                        {/* Reset Filter Button */}
                        {isFilterActive && (
                            <button
                                type="button"
                                onClick={handleResetFilter}
                                className="h-11 px-3.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors active:scale-95"
                                title="Reset pencarian dan filter"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ============================================================
                    4. KATALOG MEJA (GRID KARTU QR ATAU TABEL LIST)
                ============================================================ */}
                {filteredTables.length === 0 ? (
                    <div className="p-12 sm:p-16 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] text-center shadow-xs dark:shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                Tidak ada meja yang sesuai
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Coba ubah kata kunci pencarian atau daftarkan meja baru menggunakan tombol "Tambah Meja".
                            </p>
                            {isFilterActive && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:text-indigo-300 dark:hover:text-white dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:border-indigo-500/30 rounded-xl transition-colors active:scale-95"
                                >
                                    Bersihkan Filter
                                </button>
                            )}
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ============================================================
                        GRID KARTU MEJA & QR (HIGH CONTRAST & TOUCH FRIENDLY)
                    ============================================================ */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTables.map((table) => {
                            const isOccupied = table.status === 'occupied';
                            const qrUrl = qrImages[table.id];
                            const customerWebUrl = `/table/${table.qr_code_token}`;

                            return (
                                <div
                                    key={table.id}
                                    className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between gap-4 group"
                                >
                                    {/* 1. Header: Nomor Meja & Toggle Status Cepat (Touch Friendly) */}
                                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                                        <div className="min-w-0">
                                            <h3
                                                className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate"
                                                title={table.table_number}
                                            >
                                                {table.table_number}
                                            </h3>
                                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 block mt-0.5">
                                                ID Meja #{table.id}
                                            </span>
                                        </div>

                                        {/* Status Toggle Button (Target Sentuh Min 40px untuk Kasir 40-60 Thn) */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(table)}
                                            title="Ketuk untuk mengganti status meja"
                                            className={`shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 active:scale-95 ${
                                                isOccupied
                                                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 dark:hover:bg-amber-500/25'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35 dark:hover:bg-emerald-500/25'
                                            }`}
                                        >
                                            <span
                                                className={`w-2 h-2 rounded-full shrink-0 ${
                                                    isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                                }`}
                                            />
                                            <span>{isOccupied ? 'Terisi Tamu' : 'Tersedia'}</span>
                                        </button>
                                    </div>

                                    {/* 2. QR Code Box (Pratinjau Jelas & Klik Langsung Cetak) */}
                                    <div className="flex flex-col items-center justify-center py-1">
                                        <div
                                            onClick={() => setPrintModalTable(table)}
                                            className="group/qr relative cursor-pointer bg-white p-3 rounded-2xl shadow-md border border-slate-200 dark:border-white/20 transition-all hover:scale-[1.02]"
                                            title="Ketuk untuk melihat pratinjau kartu tenda & mencetak"
                                        >
                                            {qrUrl ? (
                                                <img
                                                    src={qrUrl}
                                                    alt={`QR Code ${table.table_number}`}
                                                    className="w-36 h-36 rounded-lg object-contain"
                                                />
                                            ) : (
                                                <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                                                    <QrCode className="w-10 h-10 animate-pulse" />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-[#0C0E16]/85 backdrop-blur-xs rounded-2xl opacity-0 group-hover/qr:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white transition-opacity duration-200">
                                                <Printer className="w-6 h-6 text-indigo-300" />
                                                <span className="text-xs font-bold">Cetak QR</span>
                                            </div>
                                        </div>

                                        {/* Quick Link & Copy Bar (Clean Inline, High Contrast) */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyUrl(table)}
                                                className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08] flex items-center gap-1.5 transition-colors shadow-xs dark:shadow-none"
                                                title="Salin tautan web pemesanan"
                                            >
                                                {copiedToken === table.id ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersalin</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                        <span>Salin Link</span>
                                                    </>
                                                )}
                                            </button>

                                            <a
                                                href={customerWebUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:text-indigo-300 dark:hover:text-white dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:border-indigo-500/25 flex items-center gap-1.5 transition-colors shadow-xs dark:shadow-none"
                                                title="Buka menu pelanggan di tab baru"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Buka Menu</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* 3. Pesanan Aktif (Hanya Muncul Jika Sedang Terisi Tamu) */}
                                    {isOccupied && table.orders && table.orders.length > 0 && (
                                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-semibold">
                                                <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                                                    Token #{table.orders[0].token_number}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30">
                                                    {table.orders[0].order_status}
                                                </span>
                                            </div>
                                            <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                                {table.orders[0].customer_name} •{' '}
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatRupiah(table.orders[0].total_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Action Buttons (Cetak Tenda & Manajemen) */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setPrintModalTable(table)}
                                            className="w-full min-h-[44px] px-4 flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#4338CA] to-[#3730A3] hover:from-[#3730A3] hover:to-[#312E81] border border-indigo-400/30 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] transition-all active:scale-98"
                                            title="Cetak kartu tenda meja dengan QR code"
                                        >
                                            <Printer className="w-4 h-4 text-indigo-200" />
                                            <span>Cetak Kartu Tenda QR</span>
                                        </button>

                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setRegenerateModalTable(table)}
                                                className="min-h-[36px] px-2.5 rounded-lg hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-1.5 transition-colors"
                                                title="Perbarui token QR baru"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                <span>Reset QR</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setDeleteModalTable(table)}
                                                className="min-h-[36px] px-2.5 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
                                                title="Hapus meja ini dari sistem"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ============================================================
                        TAMPILAN 2: TABEL LIST BARCODE MEJA (TERSTRUKTUR & RAPI)
                    ============================================================ */
                    <div className="rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xs dark:shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-800 dark:text-slate-300 min-w-[850px]">
                                <thead className="bg-slate-50 dark:bg-[#090A10] text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.08]">
                                    <tr>
                                        <th className="py-4 px-4 w-[90px] text-center whitespace-nowrap">
                                            QR Mini
                                        </th>
                                        <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">
                                            Nomor Meja
                                        </th>
                                        <th className="py-4 px-4 whitespace-nowrap min-w-[220px]">
                                            Tautan QR Meja
                                        </th>
                                        <th className="py-4 px-4 text-center whitespace-nowrap w-[140px]">
                                            Status Meja
                                        </th>
                                        <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">
                                            Pesanan Aktif
                                        </th>
                                        <th className="py-4 px-4 sm:px-5 text-right whitespace-nowrap w-[240px]">
                                            Tindakan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                    {filteredTables.map((table) => {
                                        const isOccupied = table.status === 'occupied';
                                        const qrUrl = qrImages[table.id];
                                        const customerWebUrl = `/table/${table.qr_code_token}`;

                                        return (
                                            <tr key={table.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors group">
                                                {/* Mini QR Preview */}
                                                <td className="py-4 px-4 text-center">
                                                    <div
                                                        onClick={() => setPrintModalTable(table)}
                                                        className="w-12 h-12 bg-white rounded-xl p-1 mx-auto cursor-pointer border border-slate-200 dark:border-white/20 hover:scale-105 transition-transform shadow-xs"
                                                        title="Klik untuk mencetak kartu tenda"
                                                    >
                                                        {qrUrl ? (
                                                            <img
                                                                src={qrUrl}
                                                                alt={table.table_number}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <QrCode className="w-full h-full text-slate-700" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Table Number */}
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                                                        {table.table_number}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                                                        ID Meja: #{table.id}
                                                    </div>
                                                </td>

                                                {/* Token Barcode */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/25 px-2.5 py-1 rounded-lg">
                                                            {table.qr_code_token.substring(0, 16)}...
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyUrl(table)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                                                            title="Salin link QR pelanggan"
                                                        >
                                                            {copiedToken === table.id ? (
                                                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(table)}
                                                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-2 active:scale-95 ${
                                                            isOccupied
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 dark:hover:bg-amber-500/25'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35 dark:hover:bg-emerald-500/25'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                                            }`}
                                                        />
                                                        <span>{isOccupied ? 'Terisi' : 'Tersedia'}</span>
                                                    </button>
                                                </td>

                                                {/* Active Order */}
                                                <td className="py-4 px-4">
                                                    {isOccupied && table.orders && table.orders.length > 0 ? (
                                                        <div className="text-xs">
                                                            <span className="font-mono font-bold text-amber-700 dark:text-amber-300 mr-2">
                                                                #{table.orders[0].token_number}
                                                            </span>
                                                            <span className="text-slate-800 dark:text-slate-300 font-medium">
                                                                {table.orders[0].customer_name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 dark:text-slate-500 italic">
                                                            Tidak ada pesanan aktif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-4 px-4 sm:px-5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <a
                                                            href={customerWebUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-9 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:hover:text-white dark:border-indigo-500/30 flex items-center gap-1 text-xs font-semibold transition-colors active:scale-95"
                                                            title="Buka menu QR pelanggan"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>Buka</span>
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrintModalTable(table)}
                                                            className="h-9 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white dark:border-white/[0.08] flex items-center gap-1 text-xs font-semibold transition-colors active:scale-95"
                                                            title="Cetak kartu tenda QR"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>Cetak</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegenerateModalTable(table)}
                                                            className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 dark:bg-white/[0.02] dark:hover:bg-amber-500/10 dark:text-slate-400 dark:hover:text-amber-300 dark:border-white/[0.06] dark:hover:border-amber-500/30 flex items-center justify-center transition-colors active:scale-95"
                                                            title="Reset token QR"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalTable(table)}
                                                            className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 dark:bg-white/[0.02] dark:hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 dark:border-white/[0.06] dark:hover:border-rose-500/30 flex items-center justify-center transition-colors active:scale-95"
                                                            title="Hapus meja"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
                MODAL 1: TAMBAH MEJA BARU
               ========================================================= */}
            <AcrylicModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    reset();
                }}
                title="Tambah Meja Baru"
                subtitle="Daftarkan nomor atau nama meja untuk menghasilkan token QR pemesanan mandiri."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                reset();
                            }}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            type="button"
                            variant="primary"
                            size="md"
                            loading={processing}
                            disabled={!data.table_number.trim()}
                            onClick={handleAddTable}
                        >
                            Simpan Meja
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleAddTable} className="space-y-4">
                    <AcrylicInput
                        label="Nomor / Nama Meja"
                        required
                        placeholder="Contoh: Meja 11, VIP 1, Outdoor 02"
                        value={data.table_number}
                        onChange={(e) => setData('table_number', e.target.value)}
                        error={errors.table_number}
                        autoFocus
                    />

                    {/* Quick Preset Chips for Table Name (Min 40px Height) */}
                    <div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5 font-semibold">
                            Pilihan Cepat Nomor Meja:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {['Meja 1', 'Meja 2', 'Meja 3', 'Meja 4', 'Meja 5', 'VIP 1', 'Outdoor 1'].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setData('table_number', preset)}
                                    className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
                                        data.table_number === preset
                                            ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] border-indigo-400/40 text-white shadow-sm'
                                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#08090D] dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                            Sistem akan secara otomatis membuat token QR unik 32 karakter untuk pemesanan mandiri di meja ini.
                        </span>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL 2: CETAK KARTU TENDA MEJA (TENT CARD)
               ========================================================= */}
            {printModalTable && (
                <AcrylicModal
                    isOpen={Boolean(printModalTable)}
                    onClose={() => setPrintModalTable(null)}
                    title={`Cetak Kartu Tenda Meja — ${printModalTable.table_number}`}
                    subtitle="Pratinjau kartu meja resmi dengan instruksi pemesanan mandiri untuk ditaruh di atas meja."
                    maxWidth="max-w-lg"
                    footer={
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                            <span className="text-xs text-slate-400 text-center sm:text-left">
                                Disarankan cetak pada kertas tebal / stand akrilik A6/A5.
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                <SpecularButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => setPrintModalTable(null)}
                                >
                                    Tutup
                                </SpecularButton>
                                <SpecularButton
                                    variant="primary"
                                    size="md"
                                    icon={Printer}
                                    onClick={() => window.print()}
                                >
                                    Cetak Sekarang
                                </SpecularButton>
                            </div>
                        </div>
                    }
                >
                    {/* Tent Card Preview Container */}
                    <div className="print-area flex flex-col items-center justify-center p-6 bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-[#312E81]">
                        {/* Header Brand */}
                        <div className="text-center pb-3 border-b-2 border-slate-200 w-full">
                            <h2 className="text-2xl font-black tracking-wider uppercase text-[#1E1B4B]">
                                CAFE & RESTO
                            </h2>
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#4338CA]">
                                Pesan Mandiri Lewat Meja (Self-Service)
                            </p>
                        </div>

                        {/* Large Table Number Badge */}
                        <div className="mt-4 mb-3 px-6 py-2 rounded-full bg-[#1E1B4B] text-white">
                            <span className="text-xl font-extrabold uppercase tracking-wide">
                                {printModalTable.table_number}
                            </span>
                        </div>

                        {/* High Contrast QR Code Image */}
                        <div className="p-3 bg-white rounded-xl border-2 border-slate-300 shadow-sm">
                            {qrImages[printModalTable.id] ? (
                                <img
                                    src={qrImages[printModalTable.id]}
                                    alt={`QR Code ${printModalTable.table_number}`}
                                    className="w-56 h-56 object-contain"
                                />
                            ) : (
                                <div className="w-56 h-56 flex items-center justify-center bg-slate-100">
                                    <QrCode className="w-12 h-12 text-slate-400" />
                                </div>
                            )}
                        </div>

                        {/* Step by step instructions in Indonesian */}
                        <div className="mt-4 text-center w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1.5">
                                Cara Pemesanan Mudah:
                            </div>
                            <ol className="text-xs text-slate-700 font-medium space-y-1 text-left inline-block">
                                <li>
                                    <strong className="text-[#4338CA]">1.</strong> Buka kamera HP & arahkan ke kode QR di atas
                                </li>
                                <li>
                                    <strong className="text-[#4338CA]">2.</strong> Pilih makanan / minuman favorit Anda
                                </li>
                                <li>
                                    <strong className="text-[#4338CA]">3.</strong> Konfirmasi pesanan & bayar via QRIS / Kasir
                                </li>
                                <li>
                                    <strong className="text-[#4338CA]">4.</strong> Makanan siap diantar langsung ke meja ini
                                </li>
                            </ol>
                        </div>

                        <div className="mt-3 text-[10px] text-slate-400 font-mono">
                            Token: {printModalTable.qr_code_token.substring(0, 16)}...
                        </div>
                    </div>

                    {/* Dedicated Print Media Styles */}
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            .print-area, .print-area * {
                                visibility: visible !important;
                            }
                            .print-area {
                                position: fixed !important;
                                left: 50% !important;
                                top: 50% !important;
                                transform: translate(-50%, -50%) !important;
                                width: 105mm !important;
                                max-width: 105mm !important;
                                margin: 0 auto !important;
                                box-shadow: none !important;
                                border: 2px solid #000 !important;
                                background: #fff !important;
                                color: #000 !important;
                            }
                        }
                    `}</style>
                </AcrylicModal>
            )}

            {/* =========================================================
                MODAL 3: KONFIRMASI RESET TOKEN QR
               ========================================================= */}
            <AcrylicModal
                isOpen={Boolean(regenerateModalTable)}
                onClose={() => setRegenerateModalTable(null)}
                title="Perbarui Token QR Meja Ini?"
                subtitle={regenerateModalTable ? `Meja: ${regenerateModalTable.table_number}` : ''}
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setRegenerateModalTable(null)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={RefreshCw}
                            onClick={handleConfirmRegenerateQr}
                        >
                            Ya, Perbarui Token QR
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-2">
                    <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Token QR Lama Akan Dinonaktifkan</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Jika token QR diperbarui, kode QR fisik yang saat ini tertempel di atas meja tidak akan dapat digunakan lagi oleh pelanggan.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Anda wajib mencetak ulang kartu tenda meja yang baru setelah melakukan pembaruan ini.
                    </p>
                </div>
            </AcrylicModal>

            {/* =========================================================
                MODAL 4: KONFIRMASI HAPUS MEJA
               ========================================================= */}
            <AcrylicModal
                isOpen={Boolean(deleteModalTable)}
                onClose={() => setDeleteModalTable(null)}
                title="Hapus Meja Ini?"
                subtitle={deleteModalTable ? `Meja: ${deleteModalTable.table_number}` : ''}
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setDeleteModalTable(null)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            icon={Trash2}
                            onClick={handleConfirmDelete}
                        >
                            Ya, Hapus Meja
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 space-y-2">
                    <div className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span>Meja Akan Dihapus dari Tata Letak</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Meja ini tidak akan lagi muncul pada daftar pilihan meja kasir POS maupun menu pemesanan mandiri QR pelanggan.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Riwayat pesanan dan transaksi masa lalu yang pernah terhubung dengan meja ini tetap tersimpan aman di database laporan keuangan.
                    </p>
                </div>
            </AcrylicModal>
        </AuthenticatedLayout>
    );
}
