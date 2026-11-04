import React, { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    TrendingUp,
    TrendingDown,
    PackageX,
    Wallet,
    DollarSign,
    Layers,
    SlidersHorizontal,
    Edit3,
    Plus,
    RefreshCw,
    Search,
    Clock,
    AlertTriangle,
    QrCode,
    Utensils,
    Receipt,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Trash2,
    Grid,
    Tag,
    ExternalLink,
} from 'lucide-react';

import AdminAcrylicLayout from '@/Layouts/AdminAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';

/**
 * Format currency to IDR with tabular numbers
 */
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
    // Current Active Tab
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'shifts' | 'orders' | 'tables'

    // Date preset & custom date filter state
    const [currentPreset, setCurrentPreset] = useState(filters.preset || 'today');
    const [customDate, setCustomDate] = useState(filters.date || '');

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [selectedKitchenType, setSelectedKitchenType] = useState(filters.requires_kitchen || 'all');
    const [selectedStockStatus, setSelectedStockStatus] = useState(filters.stock_status || 'all');

    // Modals state
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Inertia form for Stock Adjustment
    const {
        data: adjustmentData,
        setData: setAdjustmentData,
        post: postAdjustment,
        processing: adjustmentProcessing,
        reset: resetAdjustment,
        errors: adjustmentErrors,
    } = useForm({
        product_id: '',
        movement_type: 'in', // 'in' | 'out' | 'adjustment'
        quantity_change: 1,
        notes: '',
    });

    // Inertia form for Product Edit
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

    // Inertia form for Product Create
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

    // Inertia form for Category Create
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

    // Barcode scanner integration: when scanned, filter or open stock adjustment
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

    // Apply filters with Inertia router
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

    // Open Stock Adjustment Modal
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

    // Open Edit Product Modal
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

    // Open Delete Product Modal
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

    // Open Create Product Modal
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

    // Create Category
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

    // Update Dining Table Status
    const handleTableStatusChange = (tableId, nextStatus) => {
        router.patch(`/admin/tables/${tableId}/status`, { status: nextStatus }, { preserveScroll: true });
    };

    // Preview new stock calculation for adjustment modal
    const previewCalculatedStock = useMemo(() => {
        if (!selectedProduct) return 0;
        const current = Number(selectedProduct.stock_qty) || 0;
        const change = Number(adjustmentData.quantity_change) || 0;
        if (adjustmentData.movement_type === 'in') return current + change;
        if (adjustmentData.movement_type === 'out') return Math.max(0, current - change);
        return Math.max(0, current + change);
    }, [selectedProduct, adjustmentData.movement_type, adjustmentData.quantity_change]);

    return (
        <AdminAcrylicLayout
            title="Executive Dashboard & Inventory"
            scannerStatus={scannerStatus}
            lastScannedBarcode={lastScannedBarcode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => triggerFilter({ search: q })}
            onOpenCreateProduct={handleOpenCreate}
        >
            <Head title="Admin Dashboard & Inventory" />

            {/* =========================================================================
                DATE FILTER BAR FOR DYNAMIC P&L METRICS
               ========================================================================= */}
            <div className="flex items-center justify-between gap-4 flex-wrap select-none p-3.5 rounded-xl bg-[#0F111A]/85 backdrop-blur-md border border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                        Periode Analisis: <span className="text-indigo-300 font-mono">{summary_metrics.label}</span>
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                currentPreset === btn.id
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12] font-medium'
                                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.05]'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}

                    <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                        <input
                            type="date"
                            value={customDate}
                            onChange={handleCustomDateChange}
                            className="bg-[#0B0D13] text-slate-200 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-400 font-mono"
                        />
                    </div>

                    <SpecularButton
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => triggerFilter()}
                        title="Segarkan data metrik"
                    />
                </div>
            </div>

            {/* =========================================================================
                1. TOP BENTO GRID: RINGKASAN EKSEKUTIF & LABA RUGI (4 UNIFORM CARDS)
               ========================================================================= */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Bento Card 1: Gross Revenue */}
                <AcrylicCard
                    className="relative group border border-white/[0.07] bg-[#0B0D13]/90"
                    contentClassName="p-5 flex flex-col justify-between h-full"
                >
                    <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider text-[11px]">
                        Pendapatan ({summary_metrics.preset === 'today' ? 'Hari Ini' : 'Periode'})
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
                            {formatRupiah(summary_metrics.gross_revenue)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500">
                                Tunai: <span className="text-slate-300">{formatRupiah(summary_metrics.cash_revenue)}</span>
                            </span>
                            <span className="text-slate-500">
                                QRIS: <span className="text-slate-300">{formatRupiah(summary_metrics.qris_revenue)}</span>
                            </span>
                        </div>
                    </div>
                </AcrylicCard>

                {/* Bento Card 2: Total HPP Modal & Biaya Operasional */}
                <AcrylicCard
                    className="relative group border border-white/[0.07] bg-[#0B0D13]/90"
                    contentClassName="p-5 flex flex-col justify-between h-full"
                >
                    <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider text-[11px]">
                        HPP Modal & Operasional
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
                            {formatRupiah(summary_metrics.total_cost + summary_metrics.operational_expenses)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500">
                                HPP: <span className="text-slate-300">{formatRupiah(summary_metrics.total_cost)}</span>
                            </span>
                            <span className="text-slate-500">
                                Beban: <span className="text-slate-300">{formatRupiah(summary_metrics.operational_expenses)}</span>
                            </span>
                        </div>
                    </div>
                </AcrylicCard>

                {/* Bento Card 3: Laba Bersih (Net Profit) - Minimalist & Uniform */}
                <AcrylicCard
                    className="relative group border border-white/[0.07] bg-[#0B0D13]/90"
                    contentClassName="p-5 flex flex-col justify-between h-full"
                >
                    <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider text-[11px]">
                        Laba Bersih (Net Profit)
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
                            {formatRupiah(summary_metrics.net_profit)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.05] text-[11px] text-slate-500 font-mono flex items-center justify-between">
                            <span>Omset - (HPP + Beban)</span>
                            <span className="text-slate-400">{summary_metrics.total_orders_count} Trx</span>
                        </div>
                    </div>
                </AcrylicCard>

                {/* Bento Card 4: Status Stok Kritis */}
                <AcrylicCard
                    className="relative group border border-white/[0.07] bg-[#0B0D13]/90"
                    contentClassName="p-5 flex flex-col justify-between h-full"
                >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider text-[11px]">
                        <span>Stok Kritis</span>
                        <Link
                            href="/admin/products"
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 transition-colors normal-case"
                        >
                            <span>Kelola Produk &rarr;</span>
                        </Link>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
                                {summary_metrics.critical_stock_count}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Menu Perlu Restock</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => handleQuickStockFilter('out_of_stock')}
                                className="text-slate-400 hover:text-rose-400 font-mono transition-colors text-xs"
                            >
                                {summary_metrics.out_of_stock_count} Habis
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickStockFilter('low_stock')}
                                className="text-slate-400 hover:text-amber-400 font-mono transition-colors text-xs"
                            >
                                Menipis (≤5)
                            </button>
                        </div>
                    </div>
                </AcrylicCard>
            </section>

            {/* =========================================================================
                2. TAB NAVIGATION (INVENTORY / SHIFTS / TRANSACTIONS / TABLES)
               ========================================================================= */}
            <div className="flex items-center gap-6 border-b border-white/[0.08] select-none overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 py-3 text-xs transition-colors ${
                        activeTab === 'inventory'
                            ? 'border-b-2 border-indigo-400 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent font-medium'
                    }`}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kelola Menu & Stok ({products.total || products.data?.length || 0})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('shifts')}
                    className={`flex items-center gap-2 py-3 text-xs transition-colors ${
                        activeTab === 'shifts'
                            ? 'border-b-2 border-indigo-400 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent font-medium'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rekap Shift Kasir ({cashier_shifts.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-2 py-3 text-xs transition-colors ${
                        activeTab === 'orders'
                            ? 'border-b-2 border-indigo-400 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent font-medium'
                    }`}
                >
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span>Riwayat Transaksi ({recent_orders.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('tables')}
                    className={`flex items-center gap-2 py-3 text-xs transition-colors ${
                        activeTab === 'tables'
                            ? 'border-b-2 border-indigo-400 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent font-medium'
                    }`}
                >
                    <Grid className="w-3.5 h-3.5 text-slate-400" />
                    <span>Status Meja & QR ({dining_tables.length})</span>
                </button>
            </div>

            {/* =========================================================================
                TAB 1: KELOLA MENU, HARGA & STOK DASAR
               ========================================================================= */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {/* Sticky Filter Bar */}
                    <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter barcode / nama menu..."
                                    className="w-full bg-[#08090D] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                                />
                            </div>
                            <SpecularButton type="submit" size="sm" variant="secondary">
                                Cari
                            </SpecularButton>
                        </form>

                        <div className="flex items-center flex-wrap gap-2 text-xs">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    triggerFilter({ category_id: e.target.value });
                                }}
                                className="bg-[#08090D] text-slate-300 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name} ({c.products_count ?? 0})
                                    </option>
                                ))}
                            </select>

                            {/* Kitchen Route Filter */}
                            <select
                                value={selectedKitchenType}
                                onChange={(e) => {
                                    setSelectedKitchenType(e.target.value);
                                    triggerFilter({ requires_kitchen: e.target.value });
                                }}
                                className="bg-[#08090D] text-slate-300 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Tipe Proses</option>
                                <option value="true">Dapur / KDS</option>
                                <option value="false">Instan (Minuman/Snack)</option>
                            </select>

                            {/* Stock Status Filter */}
                            <select
                                value={selectedStockStatus}
                                onChange={(e) => {
                                    setSelectedStockStatus(e.target.value);
                                    triggerFilter({ stock_status: e.target.value });
                                }}
                                className="bg-[#08090D] text-slate-300 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Status Stok</option>
                                <option value="available">Stok Aman (&gt; 5)</option>
                                <option value="low_stock">Stok Menipis (1-5)</option>
                                <option value="out_of_stock">Stok Habis (0)</option>
                            </select>

                            <Link href="/admin/products">
                                <SpecularButton
                                    variant="secondary"
                                    size="sm"
                                    icon={ExternalLink}
                                    title="Buka Halaman Lengkap Kelola Produk & Stok"
                                >
                                    Kelola Produk & Stok
                                </SpecularButton>
                            </Link>

                            <SpecularButton
                                variant="secondary"
                                size="sm"
                                icon={Tag}
                                onClick={() => setIsCreateCategoryModalOpen(true)}
                                title="Tambah Kategori Baru"
                            >
                                + Kategori
                            </SpecularButton>

                            <SpecularButton
                                variant="primary"
                                size="sm"
                                icon={Plus}
                                onClick={handleOpenCreate}
                            >
                                Tambah Menu
                            </SpecularButton>
                        </div>
                    </div>

                    {/* Products & Inventory Table */}
                    <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-[#08090D] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06] sticky top-0 select-none">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Barcode</th>
                                        <th className="py-3 px-4 font-semibold">Nama Menu & Kategori</th>
                                        <th className="py-3 px-4 font-semibold text-center">Tipe Proses</th>
                                        <th className="py-3 px-4 font-semibold text-right">HPP Modal</th>
                                        <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                                        <th className="py-3 px-4 font-semibold text-right">Margin</th>
                                        <th className="py-3 px-4 font-semibold text-center">Stok</th>
                                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Aksi Cepat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {products.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-400">
                                                Tidak ada produk yang cocok dengan kriteria filter saat ini.
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
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-white/[0.03] transition-colors"
                                                >
                                                    {/* Barcode */}
                                                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300">
                                                        {p.barcode || '-'}
                                                    </td>

                                                    {/* Product Name & Category */}
                                                    <td className="py-3.5 px-4 font-medium text-white">
                                                        <div className="font-semibold">{p.product_name}</div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {p.category?.category_name || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Kitchen Required */}
                                                    <td className="py-3 px-4 text-center">
                                                        {p.requires_kitchen ? (
                                                            <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                                                                Dapur / KDS
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                                                                Instan
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Cost Price */}
                                                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                                                        {formatRupiah(p.cost_price)}
                                                    </td>

                                                    {/* Selling Price */}
                                                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-100">
                                                        {formatRupiah(p.selling_price)}
                                                    </td>

                                                    {/* Margin */}
                                                    <td className="py-3 px-4 text-right font-mono text-emerald-400/90 text-[11px]">
                                                        {margin}%
                                                    </td>

                                                    {/* Stock Qty */}
                                                    <td className="py-3 px-4 text-center font-mono text-xs tabular-nums">
                                                        <span
                                                            className={
                                                                isOutOfStock
                                                                    ? 'text-rose-400 font-semibold'
                                                                    : isLowStock
                                                                    ? 'text-amber-400 font-medium'
                                                                    : 'text-slate-300'
                                                            }
                                                        >
                                                            {p.stock_qty}
                                                        </span>
                                                    </td>

                                                    {/* Availability Status */}
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 select-none">
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    isOutOfStock || !p.is_available ? 'bg-rose-500' : 'bg-emerald-400'
                                                                }`}
                                                            />
                                                            <span>{isOutOfStock || !p.is_available ? 'Habis' : 'Tersedia'}</span>
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAdjustment(p)}
                                                            className="text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] rounded-md px-2.5 py-1 transition-colors"
                                                            title="Catat penyesuaian stok"
                                                        >
                                                            Stok
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(p)}
                                                            className="text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] rounded-md px-2.5 py-1 transition-colors"
                                                            title="Edit data & harga menu"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDelete(p)}
                                                            title="Hapus produk"
                                                            className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-md px-2.5 py-1 transition-colors"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {products.links && products.links.length > 3 && (
                            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 bg-white/[0.01]">
                                <div>
                                    Menampilkan {products.from || 0} - {products.to || 0} dari {products.total || 0} menu
                                </div>
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
                                                    ? 'hover:bg-white/[0.08] text-slate-300'
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

            {/* =========================================================================
                TAB 2: REKAP SHIFT KASIR (CASHIER SHIFTS)
               ========================================================================= */}
            {activeTab === 'shifts' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Menampilkan riwayat rekonsiliasi kas kasir, modal awal, penjualan tunai & QRIS, dan selisih kas fisik.
                        </div>
                        <a href="/admin/export/excel?type=shifts">
                            <SpecularButton variant="secondary" size="sm">
                                Export Rekap Shift (.csv)
                            </SpecularButton>
                        </a>
                    </div>

                    <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-[#08090D] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Nama Shift</th>
                                        <th className="py-3 px-4 font-semibold">Kasir</th>
                                        <th className="py-3 px-4 font-semibold">Waktu Buka / Tutup</th>
                                        <th className="py-3 px-4 font-semibold text-right">Modal Awal</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total Tunai</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total QRIS</th>
                                        <th className="py-3 px-4 font-semibold text-right">Kas Fisik Aktual</th>
                                        <th className="py-3 px-4 font-semibold text-right">Selisih Kas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {cashier_shifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-400">
                                                Belum ada sesi shift kasir yang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        cashier_shifts.map((s) => {
                                            const isClosed = Boolean(s.closed_at);
                                            const disc = s.discrepancy;

                                            return (
                                                <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                                                    <td className="py-3.5 px-4 font-semibold text-white">
                                                        {s.shift_name}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                                                        {s.cashier?.full_name || '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                                                        <div>{new Date(s.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="text-[10px]">
                                                            {isClosed ? new Date(s.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : (
                                                                <span className="text-emerald-400 font-semibold">SEDANG BERJALAN</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                                                        {formatRupiah(s.opening_cash)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                                                        {formatRupiah(s.total_cash_sales)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-medium text-indigo-300">
                                                        {formatRupiah(s.total_qris_sales)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono text-white">
                                                        {s.closing_cash_actual !== null ? formatRupiah(s.closing_cash_actual) : '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                                                        {disc !== null && disc !== undefined ? (
                                                            <span
                                                                className={
                                                                    disc === 0
                                                                        ? 'text-emerald-400'
                                                                        : disc > 0
                                                                        ? 'text-indigo-400'
                                                                        : 'text-rose-400'
                                                                }
                                                            >
                                                                {disc > 0 ? `+${formatRupiah(disc)}` : formatRupiah(disc)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
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

            {/* =========================================================================
                TAB 3: RIWAYAT TRANSAKSI (ORDERS HISTORY)
               ========================================================================= */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Daftar transaksi terbaru mencakup invoice, metode pembayaran, total omset, dan status pesanan.
                        </div>
                        <a href="/admin/export/excel?type=orders">
                            <SpecularButton variant="secondary" size="sm">
                                Export Riwayat Transaksi (.csv)
                            </SpecularButton>
                        </a>
                    </div>

                    <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-[#08090D] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Invoice & Token</th>
                                        <th className="py-3 px-4 font-semibold">Sumber</th>
                                        <th className="py-3 px-4 font-semibold">Kasir</th>
                                        <th className="py-3 px-4 font-semibold">Metode</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total HPP</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total Tagihan</th>
                                        <th className="py-3 px-4 font-semibold text-right">Diterima / Kembali</th>
                                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Waktu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {recent_orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-400">
                                                Belum ada data transaksi yang tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_orders.map((o) => (
                                            <tr key={o.id} className="hover:bg-white/[0.03] transition-colors">
                                                <td className="py-3.5 px-4 font-mono">
                                                    <div className="font-semibold text-white">{o.invoice_number}</div>
                                                    <div className="text-[11px] text-indigo-400">#{o.token_number}</div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {o.order_source === 'qr_table' ? (
                                                        <span className="inline-flex items-center gap-1 text-slate-300">
                                                            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                                                            {o.table?.table_number || 'QR Meja'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Kasir Langsung</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-300">
                                                    {o.cashier?.full_name || '-'}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <AcrylicBadge
                                                        variant={o.payment_method === 'qris' ? 'indigo' : 'emerald'}
                                                        size="sm"
                                                    >
                                                        {o.payment_method?.toUpperCase()}
                                                    </AcrylicBadge>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                                                    {formatRupiah(o.total_cost)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                                                    {formatRupiah(o.total_amount)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                                                    <div className="text-slate-300">{formatRupiah(o.amount_received)}</div>
                                                    <div className="text-emerald-400">
                                                        Kembali: {formatRupiah(o.change_amount)}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <AcrylicBadge
                                                        variant={o.payment_status === 'paid' ? 'emerald' : 'rose'}
                                                        size="sm"
                                                        dot
                                                    >
                                                        {o.payment_status?.toUpperCase()}
                                                    </AcrylicBadge>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
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

            {/* =========================================================================
                TAB 4: STATUS MEJA & QR ORDERING
               ========================================================================= */}
            {activeTab === 'tables' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Kelola status meja makan pelanggan dan periksa apakah ada pesanan yang sedang aktif di meja tersebut.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {dining_tables.map((table) => {
                            const isAvailable = table.status === 'available';
                            const isOccupied = table.status === 'occupied';

                            return (
                                <div
                                    key={table.id}
                                    className="p-4 rounded-xl border border-white/[0.06] bg-[#0B0D13] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col justify-between h-36"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-white font-mono">
                                                {table.table_number}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
                                                    }`}
                                                />
                                                <span>{isAvailable ? 'Tersedia' : 'Terisi'}</span>
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                            <QrCode className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{table.qr_code_token ? table.qr_code_token.substring(0, 8) + '...' : '-'}</span>
                                        </div>

                                        {table.orders_count > 0 && (
                                            <div className="mt-1.5 text-[11px] text-amber-300 font-mono">
                                                {table.orders_count} pesanan aktif
                                            </div>
                                        )}
                                    </div>

                                    {/* Action to change status */}
                                    <div className="pt-2 border-t border-white/[0.05]">
                                        <select
                                            value={table.status}
                                            onChange={(e) => handleTableStatusChange(table.id, e.target.value)}
                                            className="w-full bg-[#08090D] text-slate-300 border border-white/[0.06] rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-400/50"
                                        >
                                            <option value="available">Tersedia (Available)</option>
                                            <option value="occupied">Terisi (Occupied)</option>
                                            <option value="reserved">Dipesan (Reserved)</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL 1: PENYESUAIAN STOK (STOCK ADJUSTMENT)
               ========================================================================= */}
            <AcrylicModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                title="Penyesuaian Stok Menu"
                subtitle={selectedProduct ? `${selectedProduct.product_name} (${selectedProduct.barcode || 'No Barcode'})` : ''}
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAdjustmentModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
                            loading={adjustmentProcessing}
                            onClick={handleSubmitAdjustment}
                        >
                            Simpan Penyesuaian
                        </SpecularButton>
                    </>
                }
            >
                {selectedProduct && (
                    <form onSubmit={handleSubmitAdjustment} className="space-y-4">
                        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                            <div>
                                <span className="text-xs text-slate-400 block">Stok Dasar Saat Ini</span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {selectedProduct.stock_qty} unit
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block">Estimasi Stok Baru</span>
                                <span className="text-xl font-mono font-bold text-emerald-400">
                                    {previewCalculatedStock} unit
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                Tipe Mutasi / Penyesuaian
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'in', label: '+ Masuk (In)', color: 'emerald' },
                                    { id: 'out', label: '- Keluar (Out)', color: 'rose' },
                                    { id: 'adjustment', label: '~ Koreksi Opname', color: 'indigo' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setAdjustmentData('movement_type', type.id)}
                                        className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center select-none ${
                                            adjustmentData.movement_type === type.id
                                                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm'
                                                : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AcrylicInput
                            label="Jumlah Perubahan"
                            type="number"
                            min="1"
                            value={adjustmentData.quantity_change}
                            onChange={(e) => setAdjustmentData('quantity_change', parseInt(e.target.value) || 0)}
                            error={adjustmentErrors.quantity_change}
                            required
                        />

                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                Catatan / Keterangan
                            </label>
                            <textarea
                                rows="2"
                                value={adjustmentData.notes}
                                onChange={(e) => setAdjustmentData('notes', e.target.value)}
                                placeholder="Misal: Penerimaan supplier baru, bahan rusak, atau opname fisik harian"
                                className="w-full bg-[#131624] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                            />
                        </div>
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================================
                MODAL 2: EDIT PRODUK & HARGA
               ========================================================================= */}
            <AcrylicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Produk & Harga"
                subtitle="Perbarui HPP modal, harga jual, dan status ketersediaan menu."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
                            loading={editProcessing}
                            onClick={handleSubmitEdit}
                        >
                            Simpan Perubahan
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitEdit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                Kategori
                            </label>
                            <select
                                value={editData.category_id}
                                onChange={(e) => setEditData('category_id', e.target.value)}
                                className="w-full bg-[#131624] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <AcrylicInput
                            label="Stok Dasar"
                            type="number"
                            min="0"
                            value={editData.stock_qty}
                            onChange={(e) => setEditData('stock_qty', parseInt(e.target.value) || 0)}
                            inputClassName="font-mono text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AcrylicInput
                            label="Harga Modal HPP (Rp)"
                            type="number"
                            min="0"
                            value={editData.cost_price}
                            onChange={(e) => setEditData('cost_price', parseFloat(e.target.value) || 0)}
                            inputClassName="font-mono text-white"
                            required
                        />

                        <AcrylicInput
                            label="Harga Jual (Rp)"
                            type="number"
                            min="0"
                            value={editData.selling_price}
                            onChange={(e) => setEditData('selling_price', parseFloat(e.target.value) || 0)}
                            inputClassName="font-mono text-white"
                            required
                        />
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editData.requires_kitchen}
                                onChange={(e) => setEditData('requires_kitchen', e.target.checked)}
                                className="rounded bg-[#131624] border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div>
                                <span className="text-xs font-semibold text-white block">
                                    Butuh Proses Memasak (Dapur / KDS)
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                    Jika aktif, tiket otomatis masuk ke Kitchen Display System saat pesanan dibayar.
                                </span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editData.is_available}
                                onChange={(e) => setEditData('is_available', e.target.checked)}
                                className="rounded bg-[#131624] border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div>
                                <span className="text-xs font-semibold text-white block">
                                    Status Menu Tersedia
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                    Terkunci otomatis jika stok habis (0).
                                </span>
                            </div>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL 3: TAMBAH PRODUK BARU
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Produk / Menu Baru"
                subtitle="Masukkan detail menu untuk katalog POS dan pemesanan QR meja."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
                            loading={createProcessing}
                            onClick={handleSubmitCreate}
                        >
                            Tambah ke Menu
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AcrylicInput
                            label="Nama Menu"
                            value={createData.product_name}
                            onChange={(e) => setCreateData('product_name', e.target.value)}
                            placeholder="Contoh: Ayam Geprek Sambal Matah"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                Kategori
                            </label>
                            <select
                                value={createData.category_id}
                                onChange={(e) => setCreateData('category_id', e.target.value)}
                                className="w-full bg-[#131624] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
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
                            label="Stok Awal"
                            type="number"
                            min="0"
                            value={createData.stock_qty}
                            onChange={(e) => setCreateData('stock_qty', parseInt(e.target.value) || 0)}
                            inputClassName="font-mono text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AcrylicInput
                            label="Harga Modal HPP (Rp)"
                            type="number"
                            min="0"
                            value={createData.cost_price}
                            onChange={(e) => setCreateData('cost_price', e.target.value)}
                            placeholder="12000"
                            inputClassName="font-mono text-white"
                            required
                        />

                        <AcrylicInput
                            label="Harga Jual (Rp)"
                            type="number"
                            min="0"
                            value={createData.selling_price}
                            onChange={(e) => setCreateData('selling_price', e.target.value)}
                            placeholder="20000"
                            inputClassName="font-mono text-white"
                            required
                        />
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={createData.requires_kitchen}
                                onChange={(e) => setCreateData('requires_kitchen', e.target.checked)}
                                className="rounded bg-[#131624] border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div>
                                <span className="text-xs font-semibold text-white block">
                                    Memerlukan Proses Dapur / KDS
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                    Centang untuk menu makanan masak. Uncheck untuk minuman/snack instan langsung.
                                </span>
                            </div>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL 4: TAMBAH KATEGORI BARU
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCreateCategoryModalOpen}
                onClose={() => setIsCreateCategoryModalOpen(false)}
                title="Tambah Kategori Menu"
                subtitle="Tambahkan kategori baru untuk mengelompokkan makanan dan minuman."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreateCategoryModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
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
                        placeholder="Contoh: Paket Hemat, Minuman Hangat"
                        error={categoryErrors.category_name}
                        required
                    />
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL 5: KONFIRMASI HAPUS PRODUK
               ========================================================================= */}
            <AcrylicModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus Produk"
                subtitle={selectedProduct ? `Anda yakin ingin menghapus '${selectedProduct.product_name}'?` : ''}
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="sm"
                            onClick={handleConfirmDelete}
                        >
                            Ya, Hapus Produk
                        </SpecularButton>
                    </>
                }
            >
                <div className="text-xs text-slate-300 space-y-2">
                    <p>
                        Produk ini akan dihapus secara <strong>Soft Delete</strong> dari katalog aktif sehingga tidak lagi muncul di layar Kasir POS maupun menu QR meja.
                    </p>
                    <p className="text-slate-400">
                        Riwayat transaksi masa lalu yang memuat produk ini akan tetap tersimpan secara aman demi keutuhan data laporan keuangan Anda.
                    </p>
                </div>
            </AcrylicModal>
        </AdminAcrylicLayout>
    );
}
