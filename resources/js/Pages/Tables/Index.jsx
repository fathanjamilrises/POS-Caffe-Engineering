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
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';

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
        e.preventDefault();
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

    // Handle regenerate QR token via modal confirmation (Replacing native confirm)
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

    // Handle delete table via modal confirmation (Replacing native confirm)
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

    const metricCards = [
        {
            label: 'Total Meja',
            value: totalTables,
            subtext: 'Kapasitas meja terdaftar',
            icon: Utensils,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
        },
        {
            label: 'Meja Tersedia',
            value: availableTables,
            subtext: 'Siap digunakan pelanggan',
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
        },
        {
            label: 'Meja Terisi',
            value: occupiedTables,
            subtext: 'Sedang ada tamu / makan',
            icon: Users,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-400',
        },
        {
            label: 'Pesanan Meja Aktif',
            value: activeOrdersCount,
            subtext: 'Dalam antrean dapur & kasir',
            icon: Clock,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
        },
    ];

    return (
        <AuthenticatedLayout
            title="Manajemen Meja & QR Ordering"
            showSearch={false}
        >
            <Head title="Manajemen Meja & QR Ordering - Antarmuka Kasir & Admin" />

            <div className="space-y-6">
                {/* ============================================================
                    TOP METRIC CARDS (KONSISTEN DENGAN BERANDA & PRODUK)
                ============================================================ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metricCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 font-medium">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">
                                        {card.value}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {card.subtext}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ============================================================
                    FILTER & TOOLBAR (DENGAN TOGGLE MODE GRID / LIST BARCODE)
                ============================================================ */}
                <div className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search Input with Clear Button */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor meja (cth: Meja 1, VIP 2)..."
                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg pl-11 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="w-8 h-8 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-white"
                                aria-label="Hapus pencarian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Controls: Status Tabs, View Switcher, & CTA */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#08090D] border border-white/[0.08] rounded-lg">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    statusFilter === 'all'
                                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Semua ({totalTables})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('available')}
                                className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    statusFilter === 'available'
                                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Tersedia ({availableTables})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('occupied')}
                                className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    statusFilter === 'occupied'
                                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Terisi ({occupiedTables})
                            </button>
                        </div>

                        {/* View Mode Switcher (Grid vs List Barcode) */}
                        <div className="flex items-center p-1 bg-[#08090D] border border-white/[0.08] rounded-lg">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`min-h-[38px] px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-white/[0.1] text-white font-semibold'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title="Tampilan Kartu QR"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Kartu QR</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`min-h-[38px] px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white/[0.1] text-white font-semibold'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title="Tampilan Tabel List Barcode Meja"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">List Tabel</span>
                            </button>
                        </div>

                        <SpecularButton
                            size="md"
                            variant="primary"
                            icon={Plus}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            Tambah Meja
                        </SpecularButton>
                    </div>
                </div>

                {/* ============================================================
                    TAMPILAN 1: GRID KARTU QR (ANTI-TUMPANG TINDIH)
                ============================================================ */}
                {filteredTables.length === 0 ? (
                    <div className="text-center py-16 bg-[#0C0E16] rounded-xl border border-white/[0.08] p-8 space-y-2">
                        <Utensils className="w-12 h-12 text-slate-500 mx-auto opacity-60" />
                        <h4 className="text-base font-semibold text-slate-300">
                            Tidak ada meja yang sesuai
                        </h4>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Coba ubah kata kunci pencarian atau klik tombol "Tambah Meja" untuk mendaftarkan meja baru.
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTables.map((table) => {
                            const isOccupied = table.status === 'occupied';
                            const qrUrl = qrImages[table.id];
                            const customerWebUrl = `/table/${table.qr_code_token}`;

                            return (
                                <div
                                    key={table.id}
                                    className="bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-sm"
                                >
                                    {/* Card Header: Table Number & Status Toggle (Anti-Overlap) */}
                                    <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                                <Utensils className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3
                                                    className="text-base font-bold text-white truncate leading-tight"
                                                    title={table.table_number}
                                                >
                                                    {table.table_number}
                                                </h3>
                                                <span className="text-xs font-mono text-slate-400 block truncate">
                                                    ID: #{table.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Toggle Button (Compact & Tactile) */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(table)}
                                            title="Klik untuk mengubah status meja (Tersedia / Terisi)"
                                            className={`shrink-0 min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                                isOccupied
                                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                            }`}
                                        >
                                            <span
                                                className={`w-2 h-2 rounded-full shrink-0 ${
                                                    isOccupied ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                                                }`}
                                            />
                                            <span>{isOccupied ? 'Terisi' : 'Tersedia'}</span>
                                        </button>
                                    </div>

                                    {/* Middle: Clean QR Display */}
                                    <div className="py-4 flex flex-col items-center">
                                        <div
                                            onClick={() => setPrintModalTable(table)}
                                            className="group relative cursor-pointer bg-white p-2.5 rounded-xl shadow-md border-2 border-white/20 transition-transform duration-200 hover:scale-[1.02]"
                                            title="Klik untuk melihat pratinjau kartu tenda & mencetak QR"
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

                                            <div className="absolute inset-0 bg-[#0C0E16]/85 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-200">
                                                <Printer className="w-5 h-5 text-indigo-300" />
                                                <span className="text-xs font-semibold">Cetak QR Tenda</span>
                                            </div>
                                        </div>

                                        {/* Token / URL Preview Box */}
                                        <div className="w-full mt-3 h-10 px-3 rounded-lg bg-[#08090D] border border-white/[0.08] flex items-center justify-between gap-2 min-w-0">
                                            <span
                                                className="text-xs font-mono text-slate-400 truncate flex-1 min-w-0"
                                                title={`/table/${table.qr_code_token}`}
                                            >
                                                /table/{table.qr_code_token.substring(0, 14)}...
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyUrl(table)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors shrink-0"
                                                title="Salin tautan pemesanan meja"
                                            >
                                                {copiedToken === table.id ? (
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Active Order Info if Occupied */}
                                    {isOccupied && table.orders && table.orders.length > 0 && (
                                        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-semibold">
                                                <span className="font-mono text-amber-300">
                                                    #{table.orders[0].token_number}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-mono bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                                    {table.orders[0].order_status}
                                                </span>
                                            </div>
                                            <div className="text-slate-300 truncate">
                                                {table.orders[0].customer_name} • Rp{' '}
                                                {Number(table.orders[0].total_amount).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons: Buka Menu & Cetak Tenda */}
                                    <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                                        <a
                                            href={customerWebUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="min-h-[40px] px-2 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-gradient-to-b from-[#4F46E5] to-[#3730A3] hover:from-[#5B52EE] hover:to-[#4338CA] border border-indigo-400/20 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] transition-all truncate"
                                            title="Buka menu QR pelanggan di tab baru"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Buka Menu</span>
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() => setPrintModalTable(table)}
                                            className="min-h-[40px] px-2 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.08] transition-colors truncate"
                                            title="Cetak kartu tenda meja dengan QR code"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                            <span className="truncate">Cetak Tenda</span>
                                        </button>
                                    </div>

                                    {/* Sub Actions (Regenerate QR Token & Delete Table) */}
                                    <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-400 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRegenerateModalTable(table)}
                                            className="hover:text-amber-300 flex items-center gap-1 transition-colors py-1 shrink-0"
                                            title="Perbarui token QR baru jika kode lama hilang / rusak"
                                        >
                                            <RefreshCw className="w-3 h-3 shrink-0" />
                                            <span>Reset QR</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDeleteModalTable(table)}
                                            className="hover:text-rose-400 flex items-center gap-1 transition-colors py-1 shrink-0"
                                            title="Hapus meja ini dari sistem"
                                        >
                                            <Trash2 className="w-3 h-3 shrink-0" />
                                            <span>Hapus Meja</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ============================================================
                        TAMPILAN 2: TABEL LIST BARCODE MEJA (TERSTRUKTUR & RAPI)
                    ============================================================ */
                    <div className="rounded-xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300 min-w-[850px]">
                                <thead className="bg-[#0A0C14] text-xs text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-medium w-[80px] text-center whitespace-nowrap">
                                            QR Mini
                                        </th>
                                        <th className="py-3 px-4 font-medium whitespace-nowrap">
                                            Nomor Meja
                                        </th>
                                        <th className="py-3 px-4 font-medium whitespace-nowrap">
                                            Token Barcode QR
                                        </th>
                                        <th className="py-3 px-4 font-medium text-center whitespace-nowrap w-[130px]">
                                            Status Meja
                                        </th>
                                        <th className="py-3 px-4 font-medium whitespace-nowrap">
                                            Pesanan Meja
                                        </th>
                                        <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[240px]">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {filteredTables.map((table) => {
                                        const isOccupied = table.status === 'occupied';
                                        const qrUrl = qrImages[table.id];
                                        const customerWebUrl = `/table/${table.qr_code_token}`;

                                        return (
                                            <tr key={table.id} className="hover:bg-white/[0.02] transition-colors">
                                                {/* Mini QR Preview */}
                                                <td className="py-3 px-4 text-center">
                                                    <div
                                                        onClick={() => setPrintModalTable(table)}
                                                        className="w-12 h-12 bg-white rounded-lg p-1 mx-auto cursor-pointer border border-white/20 hover:scale-105 transition-transform"
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
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-white text-base">
                                                        {table.table_number}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        ID Meja: #{table.id}
                                                    </div>
                                                </td>

                                                {/* Token Barcode */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                                                            {table.qr_code_token.substring(0, 16)}...
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyUrl(table)}
                                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                            title="Salin link QR pelanggan"
                                                        >
                                                            {copiedToken === table.id ? (
                                                                <Check className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(table)}
                                                        className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                                                            isOccupied
                                                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                isOccupied ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                                                            }`}
                                                        />
                                                        <span>{isOccupied ? 'Terisi' : 'Tersedia'}</span>
                                                    </button>
                                                </td>

                                                {/* Active Order */}
                                                <td className="py-3 px-4">
                                                    {isOccupied && table.orders && table.orders.length > 0 ? (
                                                        <div className="text-xs">
                                                            <span className="font-mono font-bold text-amber-300 mr-2">
                                                                #{table.orders[0].token_number}
                                                            </span>
                                                            <span className="text-slate-300">
                                                                {table.orders[0].customer_name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">
                                                            Tidak ada pesanan aktif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a
                                                            href={customerWebUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
                                                            title="Buka menu QR pelanggan"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrintModalTable(table)}
                                                            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
                                                            title="Cetak kartu tenda QR"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegenerateModalTable(table)}
                                                            className="p-2 rounded-lg bg-white/[0.04] hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-white/[0.08] transition-colors"
                                                            title="Reset token QR"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalTable(table)}
                                                            className="p-2 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition-colors"
                                                            title="Hapus meja"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                    {/* Quick Preset Chips for Table Name */}
                    <div>
                        <span className="text-xs text-slate-400 block mb-1.5 font-medium">
                            Pilihan Cepat Nomor Meja:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {['Meja 1', 'Meja 2', 'Meja 3', 'Meja 4', 'Meja 5', 'VIP 1', 'Outdoor 1'].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setData('table_number', preset)}
                                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                        data.table_number === preset
                                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                                            : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.08] text-xs text-slate-300 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                            Sistem akan secara otomatis membuat token QR acak dan unik 32 karakter untuk meja ini.
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
                    title={`Cetak Kartu Tenda Meja - ${printModalTable.table_number}`}
                    subtitle="Pratinjau kartu meja resmi dengan instruksi pemesanan mandiri untuk ditaruh di atas meja."
                    maxWidth="max-w-lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-slate-400">
                                Disarankan cetak pada kertas tebal / stand akrilik A6/A5.
                            </span>
                            <div className="flex items-center gap-2">
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
                MODAL 3: KONFIRMASI RESET TOKEN QR (PENGGANTI CONFIRM)
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
                MODAL 4: KONFIRMASI HAPUS MEJA (PENGGANTI CONFIRM)
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
