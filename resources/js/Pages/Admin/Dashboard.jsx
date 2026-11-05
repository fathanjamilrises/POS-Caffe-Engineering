import React, { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Plus,
    RefreshCw,
    Search,
    QrCode,
    Receipt,
    Calendar,
    Tag,
    ExternalLink,
    Package,
    Clock,
    LayoutGrid,
} from 'lucide-react';

import AdminAcrylicLayout from '@/Layouts/AdminAcrylicLayout';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

export default function AdminDashboard({
    summary_metrics,
    products,
    cashier_shifts = [],
    recent_orders = [],
    categories = [],
    dining_tables = [],
    filters = {},
}) {
    const [activeTab, setActiveTab] = useState('inventory');
    const [currentPreset, setCurrentPreset] = useState(filters.preset || 'today');
    const [customDate, setCustomDate] = useState(filters.date || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [selectedKitchenType, setSelectedKitchenType] = useState(filters.requires_kitchen || 'all');
    const [selectedStockStatus, setSelectedStockStatus] = useState(filters.stock_status || 'all');

    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const {
        data: adjustmentData,
        setData: setAdjustmentData,
        post: postAdjustment,
        processing: adjustmentProcessing,
        reset: resetAdjustment,
        errors: adjustmentErrors,
    } = useForm({
        product_id: '',
        movement_type: 'in',
        quantity_change: 1,
        notes: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put: putProduct,
        processing: editProcessing,
        errors: editErrors,
    } = useForm({
        category_id: '',
        barcode: '',
        product_name: '',
        cost_price: 0,
        selling_price: 0,
        stock_qty: 0,
        requires_kitchen: false,
        is_available: true,
    });

    const {
        data: createData,
        setData: setCreateData,
        post: postProduct,
        processing: createProcessing,
        reset: resetCreate,
        errors: createErrors,
    } = useForm({
        category_id: categories?.[0]?.id || '',
        barcode: '',
        product_name: '',
        cost_price: '',
        selling_price: '',
        stock_qty: 0,
        requires_kitchen: true,
        is_available: true,
    });

    const {
        data: categoryData,
        setData: setCategoryData,
        post: postCategory,
        processing: categoryProcessing,
        reset: resetCategory,
        errors: categoryErrors,
    } = useForm({
        category_name: '',
    });

    const handleBarcodeDetected = (barcode) => {
        const matched = products.data?.find((p) => p.barcode === barcode);
        if (matched) {
            handleOpenAdjustment(matched);
        } else {
            setSearchQuery(barcode);
            triggerFilter({ search: barcode });
        }
    };

    const { scannerStatus, lastScannedBarcode } = useBarcodeScanner(handleBarcodeDetected);

    const triggerFilter = (newFilters = {}) => {
        const queryParams = {
            search: searchQuery,
            category_id: selectedCategory,
            requires_kitchen: selectedKitchenType,
            stock_status: selectedStockStatus,
            preset: currentPreset,
            date: customDate,
            ...newFilters,
        };
        router.get('/admin', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDatePresetChange = (preset) => {
        setCurrentPreset(preset);
        setCustomDate('');
        triggerFilter({ preset, date: '' });
    };

    const handleCustomDateChange = (e) => {
        const val = e.target.value;
        setCustomDate(val);
        setCurrentPreset('custom');
        triggerFilter({ date: val, preset: 'custom' });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        triggerFilter();
    };

    const handleQuickStockFilter = (status) => {
        setSelectedStockStatus(status);
        triggerFilter({ stock_status: status });
        setActiveTab('inventory');
    };

    const handleOpenAdjustment = (product) => {
        setSelectedProduct(product);
        setAdjustmentData({
            product_id: product.id,
            movement_type: 'in',
            quantity_change: 10,
            notes: 'Penambahan stok reguler',
        });
        setIsAdjustmentModalOpen(true);
    };

    const handleSubmitAdjustment = (e) => {
        e.preventDefault();
        postAdjustment('/admin/stock-adjustments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdjustmentModalOpen(false);
                resetAdjustment();
            },
        });
    };

    const handleOpenEdit = (product) => {
        setSelectedProduct(product);
        setEditData({
            category_id: product.category_id,
            barcode: product.barcode || '',
            product_name: product.product_name,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            stock_qty: product.stock_qty,
            requires_kitchen: Boolean(product.requires_kitchen),
            is_available: Boolean(product.is_available),
        });
        setIsEditModalOpen(true);
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        putProduct(`/admin/products/${selectedProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleOpenDelete = (product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedProduct) return;
        router.delete(`/admin/products/${selectedProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const handleOpenCreate = () => {
        resetCreate();
        if (categories?.length > 0) {
            setCreateData('category_id', categories[0].id);
        }
        setIsCreateModalOpen(true);
    };

    const handleSubmitCreate = (e) => {
        e.preventDefault();
        postProduct('/admin/products', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
            },
        });
    };

    const handleSubmitCategory = (e) => {
        e.preventDefault();
        postCategory('/admin/categories', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateCategoryModalOpen(false);
                resetCategory();
            },
        });
    };

    const handleTableStatusChange = (tableId, nextStatus) => {
        router.patch(`/admin/tables/${tableId}/status`, { status: nextStatus }, { preserveScroll: true });
    };

    const previewCalculatedStock = useMemo(() => {
        if (!selectedProduct) return 0;
        const current = Number(selectedProduct.stock_qty) || 0;
        const change = Number(adjustmentData.quantity_change) || 0;
        if (adjustmentData.movement_type === 'in') return current + change;
        if (adjustmentData.movement_type === 'out') return Math.max(0, current - change);
        return Math.max(0, current + change);
    }, [selectedProduct, adjustmentData.movement_type, adjustmentData.quantity_change]);

    /* ===================================================================
       Tab definitions — single source of truth
    =================================================================== */
    const tabs = [
        { id: 'inventory', label: 'Menu & Stok', icon: Package, count: products.total || products.data?.length || 0 },
        { id: 'shifts', label: 'Rekap Shift', icon: Clock, count: cashier_shifts.length },
        { id: 'orders', label: 'Riwayat Transaksi', icon: Receipt, count: recent_orders.length },
        { id: 'tables', label: 'Status Meja', icon: LayoutGrid, count: dining_tables.length },
    ];

    return (
        <AdminAcrylicLayout
            title="Beranda"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => triggerFilter({ search: q })}
        >
            <Head title="Beranda — Dashboard" />

            {/* ============================================================
                FILTER PERIODE
            ============================================================ */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Periode: <span className="font-medium text-white">{summary_metrics.label}</span></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: 'today', label: 'Hari Ini' },
                        { id: 'yesterday', label: 'Kemarin' },
                        { id: 'this_week', label: 'Minggu Ini' },
                        { id: 'this_month', label: 'Bulan Ini' },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleDatePresetChange(btn.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPreset === btn.id
                                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                    : 'text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}

                    <input
                        type="date"
                        value={customDate}
                        onChange={handleCustomDateChange}
                        className="bg-[#0C0E16] text-sm text-slate-200 border border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                    />

                    <button
                        type="button"
                        onClick={() => triggerFilter()}
                        className="p-2 text-slate-400 hover:text-white rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                        title="Perbarui data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ============================================================
                RINGKASAN KEUANGAN — 4 KARTU
            ============================================================ */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pendapatan */}
                <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                    <div className="text-sm text-slate-400 mb-3">Pendapatan</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        {formatRupiah(summary_metrics.gross_revenue)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                        <span className="text-slate-400">Tunai: <span className="text-slate-200 font-mono">{formatRupiah(summary_metrics.cash_revenue)}</span></span>
                        <span className="text-slate-400">QRIS: <span className="text-slate-200 font-mono">{formatRupiah(summary_metrics.qris_revenue)}</span></span>
                    </div>
                </div>

                {/* Modal & Biaya */}
                <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                    <div className="text-sm text-slate-400 mb-3">Modal & Biaya</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        {formatRupiah(summary_metrics.total_cost + summary_metrics.operational_expenses)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                        <span className="text-slate-400">HPP: <span className="text-slate-200 font-mono">{formatRupiah(summary_metrics.total_cost)}</span></span>
                        <span className="text-slate-400">Beban: <span className="text-slate-200 font-mono">{formatRupiah(summary_metrics.operational_expenses)}</span></span>
                    </div>
                </div>

                {/* Laba Bersih */}
                <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                    <div className="text-sm text-slate-400 mb-3">Laba Bersih</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        {formatRupiah(summary_metrics.net_profit)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                        <span className="text-slate-400">Pendapatan − (HPP + Beban)</span>
                        <span className="text-slate-200 font-mono">{summary_metrics.total_orders_count} transaksi</span>
                    </div>
                </div>

                {/* Stok Kritis */}
                <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-slate-400">Stok Kritis</span>
                        <Link href="/admin/products" className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                            Lihat semua →
                        </Link>
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        {summary_metrics.critical_stock_count}
                        <span className="text-sm font-normal text-slate-400 ml-2">menu perlu restock</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-4 text-sm">
                        <button
                            type="button"
                            onClick={() => handleQuickStockFilter('out_of_stock')}
                            className="text-rose-400 hover:text-rose-300 transition-colors font-mono"
                        >
                            {summary_metrics.out_of_stock_count} habis
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickStockFilter('low_stock')}
                            className="text-amber-400 hover:text-amber-300 transition-colors font-mono"
                        >
                            Menipis (≤5)
                        </button>
                    </div>
                </div>
            </section>

            {/* ============================================================
                TAB NAVIGASI
            ============================================================ */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.08] select-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
                                isActive
                                    ? 'border-indigo-400 text-white font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                            <span>{tab.label}</span>
                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.04] text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ============================================================
                TAB: MENU & STOK
            ============================================================ */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari barcode atau nama menu..."
                                    className="w-full bg-[#08090D] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <button type="submit" className="px-4 py-2.5 text-sm text-slate-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors">
                                Cari
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    triggerFilter({ category_id: e.target.value });
                                }}
                                className="bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name} ({c.products_count ?? 0})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedKitchenType}
                                onChange={(e) => {
                                    setSelectedKitchenType(e.target.value);
                                    triggerFilter({ requires_kitchen: e.target.value });
                                }}
                                className="bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="true">Perlu Dapur</option>
                                <option value="false">Instan</option>
                            </select>

                            <select
                                value={selectedStockStatus}
                                onChange={(e) => {
                                    setSelectedStockStatus(e.target.value);
                                    triggerFilter({ stock_status: e.target.value });
                                }}
                                className="bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">Semua Stok</option>
                                <option value="available">Stok Aman (&gt; 5)</option>
                                <option value="low_stock">Menipis (1-5)</option>
                                <option value="out_of_stock">Habis (0)</option>
                            </select>

                            <Link href="/admin/products">
                                <button type="button" className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-300 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="hidden sm:inline">Halaman Produk</span>
                                </button>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setIsCreateCategoryModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-300 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
                            >
                                <Tag className="w-4 h-4" />
                                <span className="hidden sm:inline">Kategori Baru</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#4F46E5] to-[#3730A3] border border-indigo-400/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:from-[#4338CA] hover:to-[#312E81] transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Menu
                            </button>
                        </div>
                    </div>

                    {/* Tabel Produk (Anti Tumpang Tindih) */}
                    <div className="rounded-xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300 min-w-[950px]">
                                <thead className="bg-[#0A0C14] text-xs text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-medium whitespace-nowrap w-[140px]">Barcode</th>
                                        <th className="py-3 px-4 font-medium whitespace-nowrap min-w-[200px]">Nama Menu</th>
                                        <th className="py-3 px-4 font-medium text-center whitespace-nowrap w-[90px]">Tipe</th>
                                        <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[110px]">Modal</th>
                                        <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[110px]">Harga Jual</th>
                                        <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[90px]">Margin</th>
                                        <th className="py-3 px-4 font-medium text-center whitespace-nowrap w-[90px]">Stok</th>
                                        <th className="py-3 px-4 font-medium text-center whitespace-nowrap w-[110px]">Status</th>
                                        <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[140px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {products.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-500">
                                                Tidak ada menu yang sesuai dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data?.map((p) => {
                                            const cost = Number(p.cost_price) || 0;
                                            const selling = Number(p.selling_price) || 0;
                                            const margin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : 0;
                                            const isOutOfStock = p.stock_qty <= 0;
                                            const isLowStock = p.stock_qty > 0 && p.stock_qty <= 5;

                                            return (
                                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 px-4 font-mono text-xs text-indigo-300 whitespace-nowrap">
                                                        {p.barcode || '—'}
                                                    </td>
                                                    <td className="py-3 px-4 min-w-[200px]">
                                                        <div className="font-medium text-white">{p.product_name}</div>
                                                        <div className="text-xs text-slate-500">{p.category?.category_name || '—'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-xs whitespace-nowrap">
                                                        {p.requires_kitchen ? (
                                                            <span className="text-amber-300">Dapur</span>
                                                        ) : (
                                                            <span className="text-slate-400">Instan</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-xs whitespace-nowrap">
                                                        {formatRupiah(p.cost_price)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-medium text-white text-xs whitespace-nowrap">
                                                        {formatRupiah(p.selling_price)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-emerald-400 text-xs whitespace-nowrap">
                                                        {margin}%
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-mono tabular-nums whitespace-nowrap">
                                                        <span className={
                                                            isOutOfStock ? 'text-rose-400 font-semibold'
                                                            : isLowStock ? 'text-amber-400 font-medium'
                                                            : 'text-slate-300'
                                                        }>
                                                            {p.stock_qty}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 text-xs">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                isOutOfStock || !p.is_available ? 'bg-rose-500' : 'bg-emerald-400'
                                                            }`} />
                                                            {isOutOfStock || !p.is_available ? 'Habis' : 'Tersedia'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <button type="button" onClick={() => handleOpenAdjustment(p)} className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/[0.06] transition-colors">Stok</button>
                                                        <button type="button" onClick={() => handleOpenEdit(p)} className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/[0.06] transition-colors">Edit</button>
                                                        <button type="button" onClick={() => handleOpenDelete(p)} className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded hover:bg-rose-500/10 transition-colors">Hapus</button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {products.links && products.links.length > 3 && (
                            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between text-sm text-slate-400">
                                <span>
                                    {products.from || 0} – {products.to || 0} dari {products.total || 0} menu
                                </span>
                                <div className="flex items-center gap-1">
                                    {products.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                            }}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-2.5 py-1 rounded text-xs transition-colors ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white font-semibold'
                                                    : link.url
                                                    ? 'hover:bg-white/[0.06] text-slate-300'
                                                    : 'text-slate-600 cursor-not-allowed'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
                TAB: REKAP SHIFT
            ============================================================ */}
            {activeTab === 'shifts' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">Riwayat kas kasir, modal awal, penjualan, dan selisih kas.</p>
                        <a href="/admin/export/excel?type=shifts">
                            <button type="button" className="text-sm text-slate-300 px-4 py-2 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors">
                                Unduh Excel
                            </button>
                        </a>
                    </div>

                    <div className="rounded-xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-[#0A0C14] text-xs text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-medium">Nama Shift</th>
                                        <th className="py-3 px-4 font-medium">Kasir</th>
                                        <th className="py-3 px-4 font-medium">Waktu</th>
                                        <th className="py-3 px-4 font-medium text-right">Modal Awal</th>
                                        <th className="py-3 px-4 font-medium text-right">Tunai</th>
                                        <th className="py-3 px-4 font-medium text-right">QRIS</th>
                                        <th className="py-3 px-4 font-medium text-right">Kas Fisik</th>
                                        <th className="py-3 px-4 font-medium text-right">Selisih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {cashier_shifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-500">
                                                Belum ada data shift kasir.
                                            </td>
                                        </tr>
                                    ) : (
                                        cashier_shifts.map((s) => {
                                            const isClosed = Boolean(s.closed_at);
                                            const disc = s.discrepancy;

                                            return (
                                                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 px-4 font-medium text-white">{s.shift_name}</td>
                                                    <td className="py-3 px-4">{s.cashier?.full_name || '—'}</td>
                                                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                                                        <div>{new Date(s.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div>
                                                            {isClosed
                                                                ? new Date(s.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                                                : <span className="text-emerald-400 font-semibold">Aktif</span>
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-slate-400">{formatRupiah(s.opening_cash)}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-slate-200">{formatRupiah(s.total_cash_sales)}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-indigo-300">{formatRupiah(s.total_qris_sales)}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-white">
                                                        {s.closing_cash_actual !== null ? formatRupiah(s.closing_cash_actual) : '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-semibold">
                                                        {disc !== null && disc !== undefined ? (
                                                            <span className={disc === 0 ? 'text-emerald-400' : disc > 0 ? 'text-indigo-400' : 'text-rose-400'}>
                                                                {disc > 0 ? `+${formatRupiah(disc)}` : formatRupiah(disc)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                TAB: RIWAYAT TRANSAKSI
            ============================================================ */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">Daftar transaksi terbaru: invoice, pembayaran, total, dan status.</p>
                        <a href="/admin/export/excel?type=orders">
                            <button type="button" className="text-sm text-slate-300 px-4 py-2 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors">
                                Unduh Excel
                            </button>
                        </a>
                    </div>

                    <div className="rounded-xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-[#0A0C14] text-xs text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-medium">Invoice</th>
                                        <th className="py-3 px-4 font-medium">Sumber</th>
                                        <th className="py-3 px-4 font-medium">Kasir</th>
                                        <th className="py-3 px-4 font-medium">Bayar</th>
                                        <th className="py-3 px-4 font-medium text-right">Modal</th>
                                        <th className="py-3 px-4 font-medium text-right">Total</th>
                                        <th className="py-3 px-4 font-medium text-right">Diterima / Kembali</th>
                                        <th className="py-3 px-4 font-medium text-center">Status</th>
                                        <th className="py-3 px-4 font-medium text-right">Waktu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {recent_orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-500">
                                                Belum ada transaksi.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_orders.map((o) => (
                                            <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 font-mono text-xs">
                                                    <div className="text-white">{o.invoice_number}</div>
                                                    <div className="text-indigo-400">#{o.token_number}</div>
                                                </td>
                                                <td className="py-3 px-4 text-xs">
                                                    {o.order_source === 'qr_table' ? (
                                                        <span className="flex items-center gap-1 text-slate-300">
                                                            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                                                            {o.table?.table_number || 'QR'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Kasir</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-xs">{o.cashier?.full_name || '—'}</td>
                                                <td className="py-3 px-4 text-xs">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        o.payment_method === 'qris'
                                                            ? 'bg-indigo-500/15 text-indigo-300'
                                                            : 'bg-emerald-500/15 text-emerald-300'
                                                    }`}>
                                                        {o.payment_method?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-400 text-xs">
                                                    {formatRupiah(o.total_cost)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-medium text-white text-xs">
                                                    {formatRupiah(o.total_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-xs">
                                                    <div className="text-slate-300">{formatRupiah(o.amount_received)}</div>
                                                    <div className="text-emerald-400">Kembali: {formatRupiah(o.change_amount)}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs ${
                                                        o.payment_status === 'paid' ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            o.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-rose-500'
                                                        }`} />
                                                        {o.payment_status === 'paid' ? 'Lunas' : 'Belum'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                                                    {new Date(o.created_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                TAB: STATUS MEJA
            ============================================================ */}
            {activeTab === 'tables' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">Kelola status meja dan lihat pesanan aktif.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {dining_tables.map((table) => {
                            const isAvailable = table.status === 'available';
                            return (
                                <div key={table.id} className="p-4 rounded-xl bg-[#0C0E16] border border-white/[0.08] flex flex-col justify-between h-36">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-white">{table.table_number}</span>
                                            <span className="inline-flex items-center gap-1.5 text-xs">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                <span className="text-slate-300">{isAvailable ? 'Kosong' : 'Terisi'}</span>
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <QrCode className="w-3.5 h-3.5" />
                                            <span className="font-mono">{table.qr_code_token ? table.qr_code_token.substring(0, 8) + '...' : '—'}</span>
                                        </div>
                                        {table.orders_count > 0 && (
                                            <div className="mt-1.5 text-xs text-amber-300">{table.orders_count} pesanan aktif</div>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-white/[0.06]">
                                        <select
                                            value={table.status}
                                            onChange={(e) => handleTableStatusChange(table.id, e.target.value)}
                                            className="w-full bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="available">Kosong</option>
                                            <option value="occupied">Terisi</option>
                                            <option value="reserved">Dipesan</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ============================================================
                MODAL 1: PENYESUAIAN STOK
            ============================================================ */}
            <AcrylicModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                title="Ubah Stok Menu"
                subtitle={selectedProduct ? `${selectedProduct.product_name} (${selectedProduct.barcode || 'Tanpa barcode'})` : ''}
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsAdjustmentModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={adjustmentProcessing}
                            onClick={handleSubmitAdjustment}
                        >
                            Simpan Perubahan
                        </SpecularButton>
                    </>
                }
            >
                {selectedProduct && (
                    <form onSubmit={handleSubmitAdjustment} className="space-y-5">
                        {/* Ringkasan Perhitungan Stok */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">Stok Saat Ini</span>
                                <span className="text-2xl font-mono font-bold text-white">
                                    {selectedProduct.stock_qty} <span className="text-sm font-normal text-slate-400">unit</span>
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block mb-1">Perkiraan Stok Baru</span>
                                <span className="text-2xl font-mono font-bold text-emerald-400">
                                    {previewCalculatedStock} <span className="text-sm font-normal text-slate-400">unit</span>
                                </span>
                            </div>
                        </div>

                        {/* Pilihan Tipe Mutasi */}
                        <div>
                            <label className="text-sm font-medium text-slate-200 block mb-2">
                                Tipe Perubahan Stok
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { id: 'in', label: 'Masuk (+)', desc: 'Tambah stok' },
                                    { id: 'out', label: 'Keluar (−)', desc: 'Kurangi stok' },
                                    { id: 'adjustment', label: 'Koreksi (~)', desc: 'Hitung fisik' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setAdjustmentData('movement_type', type.id)}
                                        className={`py-3 px-2 rounded-lg border transition-all text-center min-h-[52px] flex flex-col items-center justify-center ${
                                            adjustmentData.movement_type === type.id
                                                ? 'bg-indigo-500/20 border-indigo-500/50 text-white font-semibold shadow-sm'
                                                : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <span className="text-sm">{type.label}</span>
                                        <span className="text-[11px] opacity-70">{type.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Jumlah Input */}
                        <AcrylicInput
                            label="Jumlah Unit Perubahan"
                            type="number"
                            min="1"
                            value={adjustmentData.quantity_change}
                            onChange={(e) => setAdjustmentData('quantity_change', parseInt(e.target.value) || 0)}
                            error={adjustmentErrors.quantity_change}
                            required
                        />

                        {/* Catatan */}
                        <div>
                            <label className="text-sm font-medium text-slate-200 block mb-1.5">
                                Catatan / Keterangan (Opsional)
                            </label>
                            <textarea
                                rows="2"
                                value={adjustmentData.notes}
                                onChange={(e) => setAdjustmentData('notes', e.target.value)}
                                placeholder="Contoh: Penerimaan barang dari supplier, barang rusak, atau opname fisik"
                                className="w-full bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </form>
                )}
            </AcrylicModal>

            {/* ============================================================
                MODAL 2: EDIT PRODUK & HARGA
            ============================================================ */}
            <AcrylicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Produk & Harga"
                subtitle="Perbarui data menu, harga modal, harga jual, dan status penjualan."
                maxWidth="max-w-xl"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={editProcessing}
                            onClick={handleSubmitEdit}
                        >
                            Simpan Perubahan
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitEdit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AcrylicInput
                            label="Nama Menu"
                            value={editData.product_name}
                            onChange={(e) => setEditData('product_name', e.target.value)}
                            error={editErrors.product_name}
                            required
                        />
                        <AcrylicInput
                            label="Barcode (Opsional)"
                            value={editData.barcode}
                            onChange={(e) => setEditData('barcode', e.target.value)}
                            inputClassName="font-mono text-indigo-300"
                            placeholder="Contoh: 8991001"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-200 block mb-1.5">
                                Kategori
                            </label>
                            <select
                                value={editData.category_id}
                                onChange={(e) => setEditData('category_id', e.target.value)}
                                className="w-full bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <AcrylicInput
                            label="Stok Tersedia (Unit)"
                            type="number"
                            min="0"
                            value={editData.stock_qty}
                            onChange={(e) => setEditData('stock_qty', parseInt(e.target.value) || 0)}
                            inputClassName="font-mono"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AcrylicInput
                            label="Harga Modal HPP (Rp)"
                            type="number"
                            min="0"
                            value={editData.cost_price}
                            onChange={(e) => setEditData('cost_price', parseFloat(e.target.value) || 0)}
                            inputClassName="font-mono"
                            required
                        />
                        <AcrylicInput
                            label="Harga Jual (Rp)"
                            type="number"
                            min="0"
                            value={editData.selling_price}
                            onChange={(e) => setEditData('selling_price', parseFloat(e.target.value) || 0)}
                            inputClassName="font-mono"
                            required
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3.5">
                        <label className="flex items-start gap-3.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editData.requires_kitchen}
                                onChange={(e) => setEditData('requires_kitchen', e.target.checked)}
                                className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                            />
                            <div>
                                <span className="text-sm font-semibold text-white block">
                                    Perlu dimasak di dapur (Kitchen KDS)
                                </span>
                                <span className="text-xs text-slate-400 leading-normal block mt-0.5">
                                    Centang jika pesanan harus diproses oleh staf dapur (makanan masak).
                                </span>
                            </div>
                        </label>

                        <div className="h-px bg-white/[0.06]" />

                        <label className="flex items-start gap-3.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editData.is_available}
                                onChange={(e) => setEditData('is_available', e.target.checked)}
                                className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                            />
                            <div>
                                <span className="text-sm font-semibold text-white block">
                                    Status menu aktif dijual
                                </span>
                                <span className="text-xs text-slate-400 leading-normal block mt-0.5">
                                    Jika dinonaktifkan, menu tidak akan muncul di layar kasir maupun QR meja.
                                </span>
                            </div>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* ============================================================
                MODAL 3: TAMBAH MENU BARU
            ============================================================ */}
            <AcrylicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Menu Baru"
                subtitle="Isi data menu untuk dimasukkan ke katalog kasir dan pemesanan meja."
                maxWidth="max-w-xl"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={createProcessing}
                            onClick={handleSubmitCreate}
                        >
                            Tambah Menu
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AcrylicInput
                            label="Nama Menu"
                            value={createData.product_name}
                            onChange={(e) => setCreateData('product_name', e.target.value)}
                            placeholder="Contoh: Kopi Tubruk Robusta"
                            error={createErrors.product_name}
                            required
                        />
                        <AcrylicInput
                            label="Barcode (Scan / Ketik)"
                            value={createData.barcode}
                            onChange={(e) => setCreateData('barcode', e.target.value)}
                            placeholder="Contoh: 8991005"
                            inputClassName="font-mono text-indigo-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-200 block mb-1.5">
                                Kategori
                            </label>
                            <select
                                value={createData.category_id}
                                onChange={(e) => setCreateData('category_id', e.target.value)}
                                className="w-full bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
                                required
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <AcrylicInput
                            label="Stok Awal (Unit)"
                            type="number"
                            min="0"
                            value={createData.stock_qty}
                            onChange={(e) => setCreateData('stock_qty', parseInt(e.target.value) || 0)}
                            inputClassName="font-mono"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AcrylicInput
                            label="Harga Modal HPP (Rp)"
                            type="number"
                            min="0"
                            value={createData.cost_price}
                            onChange={(e) => setCreateData('cost_price', e.target.value)}
                            placeholder="Contoh: 12000"
                            inputClassName="font-mono"
                            required
                        />
                        <AcrylicInput
                            label="Harga Jual (Rp)"
                            type="number"
                            min="0"
                            value={createData.selling_price}
                            onChange={(e) => setCreateData('selling_price', e.target.value)}
                            placeholder="Contoh: 18000"
                            inputClassName="font-mono"
                            required
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <label className="flex items-start gap-3.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={createData.requires_kitchen}
                                onChange={(e) => setCreateData('requires_kitchen', e.target.checked)}
                                className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                            />
                            <div>
                                <span className="text-sm font-semibold text-white block">
                                    Memerlukan proses memasak di dapur
                                </span>
                                <span className="text-xs text-slate-400 leading-normal block mt-0.5">
                                    Centang untuk makanan yang dimasak. Kosongkan untuk minuman atau snack instan.
                                </span>
                            </div>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* ============================================================
                MODAL 4: TAMBAH KATEGORI BARU
            ============================================================ */}
            <AcrylicModal
                isOpen={isCreateCategoryModalOpen}
                onClose={() => setIsCreateCategoryModalOpen(false)}
                title="Kategori Menu Baru"
                subtitle="Tambahkan kategori baru untuk mengelompokkan makanan atau minuman."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsCreateCategoryModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={categoryProcessing}
                            onClick={handleSubmitCategory}
                        >
                            Simpan Kategori
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCategory} className="space-y-4">
                    <AcrylicInput
                        label="Nama Kategori"
                        value={categoryData.category_name}
                        onChange={(e) => setCategoryData('category_name', e.target.value)}
                        placeholder="Contoh: Kopi Spesial, Makanan Utama, Camilan"
                        error={categoryErrors.category_name}
                        required
                    />
                </form>
            </AcrylicModal>

            {/* ============================================================
                MODAL 5: KONFIRMASI HAPUS PRODUK
            ============================================================ */}
            <AcrylicModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Menu Ini?"
                subtitle={selectedProduct ? `Menu: ${selectedProduct.product_name}` : ''}
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            onClick={handleConfirmDelete}
                        >
                            Ya, Hapus Menu
                        </SpecularButton>
                    </>
                }
            >
                <div className="space-y-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200">
                    <div className="text-sm font-semibold text-rose-300">
                        Menu ini akan dihapus dari daftar penjualan
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Menu tidak akan lagi tampil di layar kasir maupun menu QR meja pelanggan.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Catatan transaksi dan laporan keuangan sebelumnya yang memuat menu ini tetap tersimpan dengan aman.
                    </p>
                </div>
            </AcrylicModal>
        </AdminAcrylicLayout>
    );
}
