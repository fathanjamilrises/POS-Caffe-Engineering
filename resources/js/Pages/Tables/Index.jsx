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
    ShieldAlert,
    Clock,
    Sparkles,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

export default function TablesIndex({ tables = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [qrImages, setQrImages] = useState({});
    const [copiedToken, setCopiedToken] = useState(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [printModalTable, setPrintModalTable] = useState(null);

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

    // Handle toggle status
    const handleToggleStatus = (table) => {
        const newStatus = table.status === 'available' ? 'occupied' : 'available';
        router.patch(`/tables/${table.id}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
        });
    };

    // Handle regenerate QR token
    const handleRegenerateQr = (table) => {
        if (confirm(`Perbarui token QR untuk ${table.table_number}? Link QR lama tidak akan berlaku lagi.`)) {
            router.post(`/tables/${table.id}/regenerate-qr`, {}, {
                preserveScroll: true,
            });
        }
    };

    // Handle delete table
    const handleDeleteTable = (table) => {
        if (confirm(`Yakin ingin menghapus meja ${table.table_number}?`)) {
            router.delete(`/tables/${table.id}`, {
                preserveScroll: true,
            });
        }
    };

    // Copy URL helper
    const handleCopyUrl = (table) => {
        const url = `${window.location.origin}/table/${table.qr_code_token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(table.id);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    // Filtered tables
    const filteredTables = tables.filter((table) => {
        const matchesQuery = table.table_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' || table.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // Summary metrics
    const totalTables = tables.length;
    const availableTables = tables.filter((t) => t.status === 'available').length;
    const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
    const activeOrdersCount = tables.reduce((acc, t) => acc + (t.orders_count || 0), 0);

    return (
        <AuthenticatedLayout
            title="Manajemen Meja & QR Ordering"
            showSearch={true}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Cari nomor meja (cth: Meja 1)..."
            headerRight={
                <SpecularButton
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={() => setIsAddModalOpen(true)}
                >
                    Tambah Meja
                </SpecularButton>
            }
        >
            <Head title="Manajemen Meja & QR Ordering - Kasir App" />

            <div className="space-y-6">
                {/* Top Bento Grid - Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Total Meja</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {totalTables}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            Kapasitas terdaftar
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Meja Tersedia</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {availableTables}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            Siap ditempati pelanggan
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Meja Terisi</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {occupiedTables}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            Sedang makan / memesan
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Pesanan Meja Aktif</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {activeOrdersCount}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            Dalam proses dapur / saji
                        </div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#0B0D13] border border-white/[0.06] rounded-xl">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                            }`}
                        >
                            Semua ({totalTables})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('available')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === 'available'
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                            }`}
                        >
                            Tersedia ({availableTables})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('occupied')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                statusFilter === 'occupied'
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                            }`}
                        >
                            Terisi ({occupiedTables})
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <SpecularButton
                            size="sm"
                            variant="secondary"
                            icon={Plus}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            + Meja Baru
                        </SpecularButton>
                    </div>
                </div>

                {/* Table Cards Grid */}
                {filteredTables.length === 0 ? (
                    <div className="text-center py-16 bg-[#0B0D13] rounded-xl border border-white/[0.06]">
                        <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">
                            Tidak ada meja yang ditemukan
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Coba ubah kata kunci pencarian atau tambahkan meja baru.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {filteredTables.map((table) => {
                            const isOccupied = table.status === 'occupied';
                            const qrUrl = qrImages[table.id];
                            const customerWebUrl = `/table/${table.qr_code_token}`;

                            return (
                                <div
                                    key={table.id}
                                    className="p-4 bg-[#0B0D13] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                                                <Utensils className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-200">
                                                    {table.table_number}
                                                </h3>
                                                <span className="text-[10px] font-mono text-slate-500">
                                                    ID: #{table.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Toggle Minimal 6px Dot */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(table)}
                                            title="Klik untuk mengubah status meja"
                                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] text-xs text-slate-300 hover:text-white transition-colors border border-white/[0.06]"
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    isOccupied ? 'bg-amber-400' : 'bg-emerald-400'
                                                }`}
                                            />
                                            <span>{isOccupied ? 'Terisi' : 'Tersedia'}</span>
                                        </button>
                                    </div>

                                    {/* Middle: QR Code Display & Quick Links */}
                                    <div className="py-4 flex flex-col items-center">
                                        <div
                                            onClick={() => setPrintModalTable(table)}
                                            className="group relative cursor-pointer bg-white p-2.5 rounded-xl shadow-md border border-white/20 transition-transform duration-200 hover:scale-[1.02]"
                                            title="Klik untuk memperbesar dan mencetak kartu meja"
                                        >
                                            {qrUrl ? (
                                                <img
                                                    src={qrUrl}
                                                    alt={`QR Code ${table.table_number}`}
                                                    className="w-36 h-36 rounded-lg object-contain"
                                                />
                                            ) : (
                                                <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                                                    <QrCode className="w-8 h-8 animate-pulse" />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-[#0B0D13]/85 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-200">
                                                <Printer className="w-5 h-5 text-indigo-300" />
                                                <span className="text-[11px] font-medium">Cetak QR</span>
                                            </div>
                                        </div>

                                        {/* Customer URL Preview & Copy */}
                                        <div className="w-full mt-3.5 px-2.5 py-1.5 rounded-lg bg-[#07080B] border border-white/[0.06] flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-mono text-slate-400 truncate">
                                                /table/{table.qr_code_token.substring(0, 14)}...
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyUrl(table)}
                                                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                                                title="Salin link QR pelanggan"
                                            >
                                                {copiedToken === table.id ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Active Order Info if Occupied */}
                                    {isOccupied && table.orders && table.orders.length > 0 && (
                                        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                                            <div className="flex items-center justify-between font-medium">
                                                <span className="font-mono">
                                                    #{table.orders[0].token_number}
                                                </span>
                                                <span className="text-[11px] capitalize">
                                                    {table.orders[0].order_status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                {table.orders[0].customer_name} • Rp{' '}
                                                {Number(table.orders[0].total_amount).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                                        <a
                                            href={customerWebUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] border border-indigo-400/25 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] transition-all"
                                            title="Buka menu QR seperti yang dilihat pelanggan di HP"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Buka Menu</span>
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() => setPrintModalTable(table)}
                                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
                                            title="Cetak kartu tenda meja dengan QR code"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Cetak Tenda</span>
                                        </button>
                                    </div>

                                    {/* Sub Actions (Regenerate & Delete) */}
                                    <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => handleRegenerateQr(table)}
                                            className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                                            title="Generate ulang token QR baru (token lama akan hangus)"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Reset QR</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTable(table)}
                                            className="hover:text-rose-400 flex items-center gap-1 transition-colors"
                                            title="Hapus meja ini dari database"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Tambah Meja Baru */}
            <AcrylicModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    reset();
                }}
                title="Tambah Meja Baru"
                subtitle="Masukkan nomor atau nama meja baru untuk menghasilkan token QR pemesanan otomatis."
                maxWidth="max-w-md"
            >
                <form onSubmit={handleAddTable} className="space-y-4">
                    <AcrylicInput
                        label="Nomor / Nama Meja"
                        required
                        placeholder="Contoh: Meja 11, Outdoor 02, VIP 1"
                        value={data.table_number}
                        onChange={(e) => setData('table_number', e.target.value)}
                        error={errors.table_number}
                        autoFocus
                    />

                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-400/20 text-xs text-indigo-300 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>
                            Sistem akan secara otomatis membuat token QR acak dan unik berukuran 32 karakter
                            untuk meja ini.
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                        <SpecularButton
                            variant="secondary"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                reset();
                            }}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            type="submit"
                            variant="primary"
                            loading={processing}
                            disabled={!data.table_number.trim()}
                        >
                            Simpan Meja
                        </SpecularButton>
                    </div>
                </form>
            </AcrylicModal>

            {/* Modal: Cetak Kartu Tenda Meja (Tent Card) */}
            {printModalTable && (
                <AcrylicModal
                    isOpen={Boolean(printModalTable)}
                    onClose={() => setPrintModalTable(null)}
                    title={`Cetak Kartu Meja - ${printModalTable.table_number}`}
                    subtitle="Kartu tenda meja resmi dengan instruksi pemesanan mandiri untuk ditaruh di atas meja."
                    maxWidth="max-w-lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-slate-400">
                                Gunakan kertas tebal / stand akrilik A6/A5.
                            </span>
                            <div className="flex items-center gap-2">
                                <SpecularButton
                                    variant="secondary"
                                    onClick={() => setPrintModalTable(null)}
                                >
                                    Tutup
                                </SpecularButton>
                                <SpecularButton
                                    variant="primary"
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
                                KASIR APP CANTEEN
                            </h2>
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#4338CA]">
                                Self-Service Table Ordering
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

                        {/* Step by step instructions */}
                        <div className="mt-4 text-center w-full bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1.5">
                                Cara Pemesanan Mudah:
                            </div>
                            <ol className="text-xs text-slate-600 font-medium space-y-1 text-left inline-block">
                                <li>
                                    <strong className="text-[#4338CA]">1.</strong> Buka kamera HP & arahkan ke kode QR di atas
                                </li>
                                <li>
                                    <strong className="text-[#4338CA]">2.</strong> Pilih makanan/minuman yang Anda inginkan
                                </li>
                                <li>
                                    <strong className="text-[#4338CA]">3.</strong> Konfirmasi pesanan & bayar via QRIS/Kasir
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
                                width: 100mm !important;
                                max-width: 100mm !important;
                                margin: 0 auto !important;
                                box-shadow: none !important;
                                border: 3px solid #000 !important;
                            }
                        }
                    `}</style>
                </AcrylicModal>
            )}
        </AuthenticatedLayout>
    );
}

