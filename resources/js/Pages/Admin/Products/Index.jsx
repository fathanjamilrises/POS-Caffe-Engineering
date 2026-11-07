import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    ScanLine,
    FolderPlus,
    RefreshCw,
    AlertTriangle,
    Package,
    CheckCircle2,
    XCircle,
    X,
    Pencil,
    Trash2,
    SlidersHorizontal,
    ChefHat,
    Zap,
    Barcode,
    ArrowUpDown,
    RotateCcw,
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

/**
 * AdminProductsIndex: Elevated Products & Inventory Management screen.
 * Tuned specifically for cafe/canteen staff aged 40–60 using tablet POS:
 * - Generous 44px–52px touch targets for effortless finger interaction.
 * - High-contrast typography with bold monospace numbers for prices and stock counts.
 * - Quick-stepper stock buttons (+1, +5, +10, -1, -5, -10) eliminating keyboard hassle.
 * - Strict Obsidian Ultramarine & Tanzanite palette without decorative pill clutters (Anti-Slop).
 */
export default function AdminProductsIndex({
    products = { data: [], links: [] },
    categories = [],
    metrics = {
        total_products: 0,
        available_products: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
    },
    filters = {},
}) {
    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [processFilter, setProcessFilter] = useState(filters.requires_kitchen || 'all');
    const [stockFilter, setStockFilter] = useState(filters.stock_status || 'all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isQuickScanModalOpen, setIsQuickScanModalOpen] = useState(false);

    // Selected product for edit/adjustment/delete
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quickScanInput, setQuickScanInput] = useState('');

    // Form: Create Product
    const {
        data: createData,
        setData: setCreateData,
        post: postProduct,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        category_id: categories?.[0]?.id || '',
        barcode: '',
        image_url: '',
        product_name: '',
        cost_price: '',
        selling_price: '',
        stock_qty: 10,
        requires_kitchen: false,
        is_available: true,
    });

    // Form: Edit Product
    const {
        data: editData,
        setData: setEditData,
        put: putProduct,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        category_id: '',
        barcode: '',
        image_url: '',
        product_name: '',
        cost_price: 0,
        selling_price: 0,
        stock_qty: 0,
        requires_kitchen: false,
        is_available: true,
    });

    // Form: Stock Adjustment
    const {
        data: adjustmentData,
        setData: setAdjustmentData,
        post: postAdjustment,
        processing: adjustmentProcessing,
        errors: adjustmentErrors,
        reset: resetAdjustment,
    } = useForm({
        product_id: '',
        movement_type: 'in', // 'in' | 'out' | 'adjustment'
        quantity_change: 1,
        notes: '',
    });

    // Form: Create Category
    const {
        data: categoryData,
        setData: setCategoryData,
        post: postCategory,
        processing: categoryProcessing,
        errors: categoryErrors,
        reset: resetCategory,
    } = useForm({
        category_name: '',
    });

    // Trigger Server-side Filtering
    const triggerFilter = (newFilters = {}) => {
        router.get(
            '/admin/products',
            {
                search: newFilters.search !== undefined ? newFilters.search : searchQuery,
                category_id: newFilters.category_id !== undefined ? newFilters.category_id : selectedCategory,
                requires_kitchen: newFilters.requires_kitchen !== undefined ? newFilters.requires_kitchen : processFilter,
                stock_status: newFilters.stock_status !== undefined ? newFilters.stock_status : stockFilter,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilter = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setProcessFilter('all');
        setStockFilter('all');
        router.get(
            '/admin/products',
            {
                search: '',
                category_id: 'all',
                requires_kitchen: 'all',
                stock_status: 'all',
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const isFilterActive =
        Boolean(searchQuery) ||
        selectedCategory !== 'all' ||
        processFilter !== 'all' ||
        stockFilter !== 'all';

    // Hardware Barcode Scanner Integration
    const handleBarcodeDetected = (barcode) => {
        const cleanCode = barcode.trim();
        if (!cleanCode) return;

        if (isCreateModalOpen) {
            setCreateData('barcode', cleanCode);
            return;
        }

        if (isEditModalOpen) {
            setEditData('barcode', cleanCode);
            return;
        }

        const existing = products.data?.find((p) => p.barcode === cleanCode);
        if (existing) {
            handleOpenAdjustment(existing);
        } else {
            resetCreate();
            setCreateData({
                category_id: categories?.[0]?.id || '',
                barcode: cleanCode,
                product_name: '',
                cost_price: '',
                selling_price: '',
                stock_qty: 10,
                requires_kitchen: false,
                is_available: true,
            });
            setIsCreateModalOpen(true);
        }
    };

    useBarcodeScanner(handleBarcodeDetected);

    // Open Create Modal
    const handleOpenCreate = (prefilledBarcode = '') => {
        resetCreate();
        setCreateData({
            category_id: categories?.[0]?.id || '',
            barcode: prefilledBarcode || '',
            image_url: '',
            product_name: '',
            cost_price: '',
            selling_price: '',
            stock_qty: 10,
            requires_kitchen: false,
            is_available: true,
        });
        setIsCreateModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (product) => {
        setSelectedProduct(product);
        setEditData({
            category_id: product.category_id,
            barcode: product.barcode || '',
            image_url: product.image_url || '',
            product_name: product.product_name,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            stock_qty: product.stock_qty,
            requires_kitchen: Boolean(product.requires_kitchen),
            is_available: Boolean(product.is_available),
        });
        setIsEditModalOpen(true);
    };

    // Open Adjustment Modal
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

    // Open Delete Modal
    const handleOpenDelete = (product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    // Submit Create Product
    const handleSubmitCreate = (e) => {
        if (e) e.preventDefault();
        postProduct('/admin/products', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
            },
        });
    };

    // Submit Edit Product
    const handleSubmitEdit = (e) => {
        if (e) e.preventDefault();
        if (!selectedProduct) return;
        putProduct(`/admin/products/${selectedProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
            },
        });
    };

    // Submit Stock Adjustment
    const handleSubmitAdjustment = (e) => {
        if (e) e.preventDefault();
        postAdjustment('/admin/products/stock-adjustments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdjustmentModalOpen(false);
                resetAdjustment();
            },
        });
    };

    // Submit Delete Product
    const handleConfirmDelete = () => {
        if (!selectedProduct) return;
        router.delete(`/admin/products/${selectedProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    // Submit Category
    const handleSubmitCategory = (e) => {
        if (e) e.preventDefault();
        postCategory('/admin/categories', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCategoryModalOpen(false);
                resetCategory();
            },
        });
    };

    // Quick Scan manual check
    const handleProcessQuickScan = (e) => {
        e.preventDefault();
        const code = quickScanInput.trim();
        if (!code) return;
        setIsQuickScanModalOpen(false);
        setQuickScanInput('');
        handleBarcodeDetected(code);
    };

    // Quick increment adjustment quantity
    const handleStepQuantity = (delta) => {
        const current = Number(adjustmentData.quantity_change) || 0;
        const next = Math.max(1, current + delta);
        setAdjustmentData('quantity_change', next);
    };

    // Stock adjustment preview calculation
    const previewCalculatedStock = useMemo(() => {
        if (!selectedProduct) return 0;
        const current = Number(selectedProduct.stock_qty) || 0;
        const change = Number(adjustmentData.quantity_change) || 0;
        if (adjustmentData.movement_type === 'in') return current + change;
        if (adjustmentData.movement_type === 'out') return Math.max(0, current - change);
        return Math.max(0, current + change);
    }, [selectedProduct, adjustmentData.movement_type, adjustmentData.quantity_change]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        triggerFilter();
    };

    return (
        <AdminAcrylicLayout
            title="Produk & Stok"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => triggerFilter({ search: q })}
        >
            <Head title="Produk & Stok — Kelola Menu" />

            <div className="space-y-6">
                {/* ============================================================
                    1. HEADER CARD & ACTION CONTROLS (HIGH ERGONOMICS FOR TABLET)
                ============================================================ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm">
                    {/* Left: Icon Badge & Descriptive Title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4338CA] via-[#3730A3] to-[#1E1B4B] flex items-center justify-center border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shrink-0">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate">
                                Katalog Menu & Manajemen Stok
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium truncate mt-0.5">
                                Pantau ketersediaan bahan, harga jual HPP, dan nomor barcode secara akurat.
                            </p>
                        </div>
                    </div>

                    {/* Right: Tactile Action Buttons (Min 44px Height for Finger Tapping) */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            icon={ScanLine}
                            onClick={() => setIsQuickScanModalOpen(true)}
                            title="Scan Barcode Produk"
                        >
                            <span>Scan Barcode</span>
                        </SpecularButton>

                        <SpecularButton
                            variant="secondary"
                            size="md"
                            icon={FolderPlus}
                            onClick={() => setIsCategoryModalOpen(true)}
                            title="Tambah Kategori Baru"
                        >
                            <span>Kategori Baru</span>
                        </SpecularButton>

                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={Plus}
                            onClick={() => handleOpenCreate()}
                            title="Tambah Menu Baru ke Katalog"
                        >
                            <span>Tambah Menu</span>
                        </SpecularButton>
                    </div>
                </div>

                {/* ============================================================
                    2. METRIC CARDS — INVENTORY HEALTH SUMMARY
                ============================================================ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Menu */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Total Menu
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
                                {metrics.total_products}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Katalog produk aktif terdaftar</span>
                        </div>
                    </div>

                    {/* Card 2: Stok Aman */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Stok Aman
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {metrics.available_products}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Tersedia &gt; 5 unit</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Siap Saji</span>
                        </div>
                    </div>

                    {/* Card 3: Stok Menipis */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Stok Menipis
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 tracking-tight">
                                {metrics.low_stock_products}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Sisa 1 – 5 unit</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">Perlu Restock</span>
                        </div>
                    </div>

                    {/* Card 4: Stok Habis */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-all shadow-xs dark:shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Stok Habis
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                    <XCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 tracking-tight">
                                {metrics.out_of_stock_products}
                            </div>
                        </div>
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>Stok 0 unit</span>
                            <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">Tidak Dijual</span>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    3. FILTER & PENCARIAN (ERGONOMIS DENGAN TOUCH TARGET BESAR)
                ============================================================ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm space-y-3.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Bar with Clear Button */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari barcode atau nama menu..."
                                    className="w-full h-11 bg-white dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 rounded-xl pl-10 pr-9 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors shadow-xs dark:shadow-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            triggerFilter({ search: '' });
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
                                        title="Hapus pencarian"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <SpecularButton
                                type="submit"
                                variant="secondary"
                                size="md"
                                className="min-h-[44px]"
                            >
                                Cari
                            </SpecularButton>
                        </form>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Kategori */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    triggerFilter({ category_id: e.target.value });
                                }}
                                className="h-11 bg-white dark:bg-[#08090D] text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-indigo-500 rounded-xl px-3.5 focus:outline-none transition-colors shadow-xs dark:shadow-none"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name} ({c.products_count ?? 0})
                                    </option>
                                ))}
                            </select>

                            {/* Tipe Proses */}
                            <select
                                value={processFilter}
                                onChange={(e) => {
                                    setProcessFilter(e.target.value);
                                    triggerFilter({ requires_kitchen: e.target.value });
                                }}
                                className="h-11 bg-white dark:bg-[#08090D] text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-indigo-500 rounded-xl px-3.5 focus:outline-none transition-colors shadow-xs dark:shadow-none"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="true">Perlu Dapur (KDS)</option>
                                <option value="false">Instan (Minuman/Snack)</option>
                            </select>

                            {/* Status Stok */}
                            <select
                                value={stockFilter}
                                onChange={(e) => {
                                    setStockFilter(e.target.value);
                                    triggerFilter({ stock_status: e.target.value });
                                }}
                                className="h-11 bg-white dark:bg-[#08090D] text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-indigo-500 rounded-xl px-3.5 focus:outline-none transition-colors shadow-xs dark:shadow-none"
                            >
                                <option value="all">Semua Status Stok</option>
                                <option value="available">Stok Aman (&gt; 5)</option>
                                <option value="low_stock">Menipis (1 – 5)</option>
                                <option value="out_of_stock">Habis (0)</option>
                            </select>

                            {/* Reset Filter Button (If Active) */}
                            {isFilterActive && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="h-11 px-3.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors active:scale-95"
                                    title="Reset seluruh filter"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset</span>
                                </button>
                            )}

                            {/* Refresh Button */}
                            <button
                                type="button"
                                onClick={() => triggerFilter()}
                                className="w-11 h-11 text-slate-400 hover:text-white rounded-xl border border-white/[0.08] bg-[#08090D] hover:bg-white/[0.06] flex items-center justify-center transition-colors shrink-0 active:scale-95"
                                title="Perbarui data produk"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    4. KATALOG MENU (CARD GRID — ERGONOMIS & KONSISTEN)
                ============================================================ */}
                {products.data?.length === 0 ? (
                    <div className="p-12 sm:p-16 rounded-2xl bg-[#0C0E16] border border-white/[0.08] text-center shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
                                <Package className="w-6 h-6" />
                            </div>
                            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                                Tidak ada menu yang sesuai
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                Coba ubah kata kunci pencarian atau sesuaikan filter yang sedang aktif.
                            </p>
                            {isFilterActive && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl transition-colors active:scale-95"
                                >
                                    Bersihkan Filter
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {products.data.map((p) => {
                            const cost = Number(p.cost_price) || 0;
                            const selling = Number(p.selling_price) || 0;
                            const margin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : 0;
                            const isOutOfStock = p.stock_qty <= 0;
                            const isLowStock = p.stock_qty > 0 && p.stock_qty <= 5;

                            return (
                                <div
                                    key={p.id}
                                    className="p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-sm flex flex-col justify-between gap-4 group"
                                >
                                    {/* 1. Header: Meta (Barcode & Kategori) + Tipe Proses */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs gap-2">
                                            <div className="flex items-center gap-2 min-w-0 font-mono text-slate-600 dark:text-slate-400">
                                                <span className="text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                                                    {p.barcode || 'NO-BARCODE'}
                                                </span>
                                                <span className="text-slate-400 dark:text-slate-600">•</span>
                                                <span className="text-slate-600 dark:text-slate-400 font-sans truncate">
                                                    {p.category?.category_name || 'Umum'}
                                                </span>
                                            </div>

                                            {p.requires_kitchen ? (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 inline-flex items-center gap-1 shrink-0">
                                                    <ChefHat className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                    <span>Dapur</span>
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] inline-flex items-center gap-1 shrink-0">
                                                    <Zap className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    <span>Instan</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Nama Produk */}
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight leading-snug line-clamp-2">
                                            {p.product_name}
                                        </h3>
                                    </div>

                                    {/* 2. Harga & Sisa Stok (Tata Letak Terbuka, Tanpa Kotak Bertingkat) */}
                                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                                                {formatRupiah(p.selling_price)}
                                            </span>
                                            <span
                                                className={`font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg ${
                                                    isOutOfStock
                                                        ? 'text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-300 dark:bg-rose-500/15 dark:border-rose-500/25'
                                                        : isLowStock
                                                        ? 'text-amber-800 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-500/15 dark:border-amber-500/25'
                                                        : 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/25'
                                                }`}
                                            >
                                                {isOutOfStock ? 'Stok Habis' : isLowStock ? `Sisa ${p.stock_qty}` : `${p.stock_qty} unit`}
                                            </span>
                                        </div>

                                        {/* Financial Insight: HPP & Margin */}
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                                            <span>HPP: <strong className="text-slate-800 dark:text-slate-300">{formatRupiah(p.cost_price)}</strong></span>
                                            <span className="text-slate-400 dark:text-slate-500">•</span>
                                            <span>Margin: <strong className="text-emerald-600 dark:text-emerald-400">+{margin}%</strong></span>
                                        </div>
                                    </div>

                                    {/* 3. Tombol Aksi (Target 42px Ramah Sentuh Tablet) */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAdjustment(p)}
                                            className="flex-1 h-11 px-3 text-xs sm:text-sm font-semibold !text-white bg-gradient-to-r from-[#4338CA] to-[#312E81] hover:from-[#3730A3] hover:to-[#1E1B4B] border border-indigo-400/30 rounded-xl flex items-center justify-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] active:scale-95 transition-all"
                                            title="Sesuaikan jumlah stok menu"
                                        >
                                            <SlidersHorizontal className="w-4 h-4 text-white" />
                                            <span>Ubah Stok</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(p)}
                                            className="w-11 h-11 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                                            title="Edit nama, harga, dan kategori"
                                            aria-label="Edit menu"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenDelete(p)}
                                            className="w-11 h-11 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.02] dark:hover:bg-rose-500/15 border border-slate-200 hover:border-rose-200 dark:border-white/[0.06] dark:hover:border-rose-500/30 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                                            title="Hapus menu dari katalog"
                                            aria-label="Hapus menu"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination (Di bawah Grid Kartu) */}
                {products.links && products.links.length > 3 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
                        <div>
                            Menampilkan{' '}
                            <span className="font-mono text-slate-200 font-semibold">{products.from || 0}</span> –{' '}
                            <span className="font-mono text-slate-200 font-semibold">{products.to || 0}</span> dari{' '}
                            <span className="font-mono text-slate-200 font-semibold">{products.total || 0}</span> menu
                        </div>
                        <div className="flex items-center gap-1.5">
                            {products.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                    }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`min-h-[38px] min-w-[38px] px-3 py-1 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                        link.active
                                            ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                                            : link.url
                                            ? 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06]'
                                            : 'text-slate-600 bg-transparent cursor-not-allowed opacity-50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
                MODAL 1: PENYESUAIAN STOK DENGAN STEPPER (TABLET FIRST)
            ============================================================ */}
            <AcrylicModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                title="Penyesuaian Stok Menu"
                subtitle={
                    selectedProduct
                        ? `${selectedProduct.product_name} • Barcode: ${selectedProduct.barcode || 'Tanpa Barcode'}`
                        : ''
                }
                maxWidth="max-w-lg"
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
                            Simpan Perubahan Stok
                        </SpecularButton>
                    </>
                }
            >
                {selectedProduct && (
                    <form onSubmit={handleSubmitAdjustment} className="space-y-5">
                        {/* Ringkasan Perhitungan Stok (2 Komparasi Besar) */}
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    Stok Saat Ini
                                </span>
                                <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                                    {selectedProduct.stock_qty}{' '}
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">unit</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    Perkiraan Stok Baru
                                </span>
                                <div className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                                    {previewCalculatedStock}{' '}
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">unit</span>
                                </div>
                            </div>
                        </div>

                        {/* Pilihan Tipe Mutasi */}
                        <div>
                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-2">
                                Tipe Perubahan Stok
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { id: 'in', label: 'Masuk (+)', desc: 'Tambah stok barang' },
                                    { id: 'out', label: 'Keluar (−)', desc: 'Kurangi stok barang' },
                                    { id: 'adjustment', label: 'Opname (~)', desc: 'Koreksi stok fisik' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setAdjustmentData('movement_type', type.id)}
                                        className={`py-3 px-2 rounded-xl border transition-all text-center min-h-[56px] flex flex-col items-center justify-center active:scale-95 ${
                                            adjustmentData.movement_type === type.id
                                                ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs dark:bg-[#1E1B4B] dark:bg-gradient-to-br dark:from-indigo-950 dark:to-[#1E1B4B] dark:border-indigo-500/50 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/[0.02] dark:border-white/[0.08] dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <span className="text-sm">{type.label}</span>
                                        <span className="text-[11px] opacity-75 mt-0.5">{type.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Jumlah Unit dengan Tombol Cepat (Stepper) untuk Kemudahan Staf Usia 40-60 */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                Jumlah Unit Perubahan
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStepQuantity(-10)}
                                    className="h-11 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/[0.08] rounded-xl active:scale-95"
                                    title="Kurangi 10"
                                >
                                    −10
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStepQuantity(-1)}
                                    className="h-11 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/[0.08] rounded-xl active:scale-95"
                                    title="Kurangi 1"
                                >
                                    −1
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustmentData.quantity_change}
                                    onChange={(e) =>
                                        setAdjustmentData('quantity_change', parseInt(e.target.value) || 0)
                                    }
                                    className="h-11 flex-1 bg-white dark:bg-[#08090D] border border-slate-300 dark:border-white/[0.08] rounded-xl text-center font-mono text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleStepQuantity(1)}
                                    className="h-11 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/[0.08] rounded-xl active:scale-95"
                                    title="Tambah 1"
                                >
                                    +1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStepQuantity(10)}
                                    className="h-11 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/[0.08] rounded-xl active:scale-95"
                                    title="Tambah 10"
                                >
                                    +10
                                </button>
                            </div>
                            {adjustmentErrors.quantity_change && (
                                <p className="text-xs text-rose-500 font-medium">
                                    {adjustmentErrors.quantity_change}
                                </p>
                            )}
                        </div>

                        {/* Catatan Perubahan */}
                        <div>
                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                Catatan / Keterangan (Opsional)
                            </label>
                            <textarea
                                rows="2"
                                value={adjustmentData.notes}
                                onChange={(e) => setAdjustmentData('notes', e.target.value)}
                                placeholder="Contoh: Penerimaan barang dari supplier, barang kadaluarsa, atau audit fisik"
                                className="w-full bg-white dark:bg-[#08090D] border border-slate-300 dark:border-white/[0.08] rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs"
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
                {selectedProduct && (
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
                                label="Nomor Barcode (Opsional)"
                                value={editData.barcode}
                                onChange={(e) => setEditData('barcode', e.target.value)}
                                inputClassName="font-mono text-indigo-300"
                                placeholder="Contoh: 8991001"
                            />
                        </div>

                        <AcrylicInput
                            label="URL Foto Produk (Opsional untuk Menu QR Pelanggan)"
                            value={editData.image_url}
                            onChange={(e) => setEditData('image_url', e.target.value)}
                            placeholder="https://images.unsplash.com/... atau /images/menu.jpg"
                            error={editErrors.image_url}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-200 block mb-1.5">
                                    Kategori
                                </label>
                                <select
                                    value={editData.category_id}
                                    onChange={(e) => setEditData('category_id', e.target.value)}
                                    className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                                inputClassName="font-mono font-bold"
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
                                inputClassName="font-mono font-bold text-slate-900 dark:text-white"
                                required
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3.5">
                            <label className="flex items-start gap-3.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={editData.requires_kitchen}
                                    onChange={(e) => setEditData('requires_kitchen', e.target.checked)}
                                    className="rounded bg-white dark:bg-[#08090D] border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                                        Perlu dimasak di dapur (Kitchen KDS)
                                    </span>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal block mt-0.5">
                                        Centang jika pesanan harus diproses oleh staf dapur (makanan masak).
                                    </span>
                                </div>
                            </label>

                            <div className="h-px bg-slate-200 dark:bg-white/[0.06]" />

                            <label className="flex items-start gap-3.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={editData.is_available}
                                    onChange={(e) => setEditData('is_available', e.target.checked)}
                                    className="rounded bg-white dark:bg-[#08090D] border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                                        Status menu aktif dijual
                                    </span>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal block mt-0.5">
                                        Jika dinonaktifkan, menu tidak akan muncul di layar kasir maupun QR meja.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </form>
                )}
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
                            label="Nomor Barcode (Scan / Ketik)"
                            value={createData.barcode}
                            onChange={(e) => setCreateData('barcode', e.target.value)}
                            placeholder="Contoh: 8991005"
                            inputClassName="font-mono text-indigo-300"
                        />
                    </div>

                    <AcrylicInput
                        label="URL Foto Produk (Opsional untuk Menu QR Pelanggan)"
                        value={createData.image_url}
                        onChange={(e) => setCreateData('image_url', e.target.value)}
                        placeholder="https://images.unsplash.com/... atau /images/menu.jpg"
                        error={createErrors.image_url}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                                Kategori
                            </label>
                            <select
                                value={createData.category_id}
                                onChange={(e) => setCreateData('category_id', e.target.value)}
                                className="w-full h-11 bg-white dark:bg-[#08090D] border border-slate-300 dark:border-white/[0.08] rounded-xl px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
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
                            inputClassName="font-mono font-bold"
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
                            inputClassName="font-mono font-bold text-slate-900 dark:text-white"
                            required
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                        <label className="flex items-start gap-3.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={createData.requires_kitchen}
                                onChange={(e) => setCreateData('requires_kitchen', e.target.checked)}
                                className="rounded bg-white dark:bg-[#08090D] border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mt-0.5 shrink-0"
                            />
                            <div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                                    Memerlukan proses memasak di dapur
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal block mt-0.5">
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
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="Kategori Menu Baru"
                subtitle="Tambahkan kategori baru untuk mengelompokkan makanan atau minuman."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsCategoryModalOpen(false)}
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
                MODAL 5: SCAN BARCODE CEPAT
            ============================================================ */}
            <AcrylicModal
                isOpen={isQuickScanModalOpen}
                onClose={() => setIsQuickScanModalOpen(false)}
                title="Scan Barcode Cepat"
                subtitle="Arahkan scanner ke produk atau ketik nomor barcode di bawah."
                maxWidth="max-w-md"
                footer={
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        onClick={() => setIsQuickScanModalOpen(false)}
                    >
                        Tutup
                    </SpecularButton>
                }
            >
                <form onSubmit={handleProcessQuickScan} className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <ScanLine className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                Scanner Barcode Siap
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                                Jika menu sudah ada, jendela ubah stok akan terbuka. Jika belum ada, form tambah menu baru akan otomatis terisi barcode ini.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                            Atau Masukkan Nomor Barcode Manual:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                autoFocus
                                value={quickScanInput}
                                onChange={(e) => setQuickScanInput(e.target.value)}
                                placeholder="Contoh: 8991001234..."
                                className="h-11 flex-1 bg-white dark:bg-[#08090D] border border-slate-300 dark:border-white/[0.08] rounded-xl px-3.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs"
                            />
                            <SpecularButton
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={!quickScanInput.trim()}
                            >
                                Proses
                            </SpecularButton>
                        </div>
                    </div>
                </form>
            </AcrylicModal>

            {/* ============================================================
                MODAL 6: HAPUS PRODUK
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
