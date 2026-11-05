import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    ScanLine,
    FolderPlus,
    RefreshCw,
    AlertTriangle,
    QrCode,
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
        e.preventDefault();
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
        e.preventDefault();
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
        e.preventDefault();
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
        e.preventDefault();
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
                    RINGKASAN METRIK STOK (4 KARTU — KONSISTEN DENGAN BERANDA)
                ============================================================ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Menu */}
                    <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                        <div className="text-sm text-slate-400 mb-3">Total Menu</div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-white">
                            {metrics.total_products}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                            <span className="text-slate-400">Katalog terdaftar</span>
                            <span className="text-slate-200 font-mono">Semua varian</span>
                        </div>
                    </div>

                    {/* Card 2: Stok Aman */}
                    <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                        <div className="text-sm text-slate-400 mb-3">Stok Aman</div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                            {metrics.available_products}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                            <span className="text-slate-400">Tersedia</span>
                            <span className="text-emerald-400 font-mono">&gt; 5 unit</span>
                        </div>
                    </div>

                    {/* Card 3: Stok Menipis */}
                    <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                        <div className="text-sm text-slate-400 mb-3">Stok Menipis</div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                            {metrics.low_stock_products}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                            <span className="text-slate-400">Perlu restock</span>
                            <span className="text-amber-400 font-mono">1 – 5 unit</span>
                        </div>
                    </div>

                    {/* Card 4: Stok Habis */}
                    <div className="p-5 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                        <div className="text-sm text-slate-400 mb-3">Stok Habis</div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
                            {metrics.out_of_stock_products}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-sm">
                            <span className="text-slate-400">Habis / Nonaktif</span>
                            <span className="text-rose-400 font-mono">0 unit</span>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    BAR FILTER & PENCARIAN (KONSISTEN DENGAN BERANDA)
                ============================================================ */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0C0E16] border border-white/[0.08]">
                    {/* Form Pencarian */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari barcode atau nama menu..."
                                className="w-full bg-[#08090D] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 text-sm text-slate-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Filter & Tombol Aksi */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Kategori */}
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

                        {/* Tipe Proses */}
                        <select
                            value={processFilter}
                            onChange={(e) => {
                                setProcessFilter(e.target.value);
                                triggerFilter({ requires_kitchen: e.target.value });
                            }}
                            className="bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="true">Perlu Dapur</option>
                            <option value="false">Instan</option>
                        </select>

                        {/* Status Stok */}
                        <select
                            value={stockFilter}
                            onChange={(e) => {
                                setStockFilter(e.target.value);
                                triggerFilter({ stock_status: e.target.value });
                            }}
                            className="bg-[#08090D] text-sm text-slate-300 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">Semua Stok</option>
                            <option value="available">Stok Aman (&gt; 5)</option>
                            <option value="low_stock">Menipis (1-5)</option>
                            <option value="out_of_stock">Habis (0)</option>
                        </select>

                        {/* Tombol Scan Barcode */}
                        <button
                            type="button"
                            onClick={() => setIsQuickScanModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-300 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                            <ScanLine className="w-4 h-4 text-indigo-400" />
                            <span className="hidden sm:inline">Scan Barcode</span>
                        </button>

                        {/* Tombol Kategori Baru */}
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-300 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                            <FolderPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Kategori Baru</span>
                        </button>

                        {/* Tombol Segarkan */}
                        <button
                            type="button"
                            onClick={() => triggerFilter()}
                            className="p-2.5 text-slate-400 hover:text-white rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                            title="Segarkan data"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* Tombol Utama Tambah Menu */}
                        <button
                            type="button"
                            onClick={() => handleOpenCreate()}
                            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-[#4F46E5] to-[#3730A3] border border-indigo-400/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:from-[#4338CA] hover:to-[#312E81] transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Menu
                        </button>
                    </div>
                </div>

                {/* ============================================================
                    TABEL MENU & STOK (KONSISTEN DENGAN BERANDA - ANTI TUMPANG TINDIH)
                ============================================================ */}
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
                                                {/* Barcode */}
                                                <td className="py-3 px-4 font-mono text-xs text-indigo-300 whitespace-nowrap">
                                                    {p.barcode || '—'}
                                                </td>

                                                {/* Nama Menu & Kategori */}
                                                <td className="py-3 px-4 min-w-[200px]">
                                                    <div className="font-medium text-white">{p.product_name}</div>
                                                    <div className="text-xs text-slate-500">{p.category?.category_name || '—'}</div>
                                                </td>

                                                {/* Tipe Proses */}
                                                <td className="py-3 px-4 text-center text-xs whitespace-nowrap">
                                                    {p.requires_kitchen ? (
                                                        <span className="text-amber-300">Dapur</span>
                                                    ) : (
                                                        <span className="text-slate-400">Instan</span>
                                                    )}
                                                </td>

                                                {/* Modal */}
                                                <td className="py-3 px-4 text-right font-mono text-slate-400 text-xs whitespace-nowrap">
                                                    {formatRupiah(p.cost_price)}
                                                </td>

                                                {/* Harga Jual */}
                                                <td className="py-3 px-4 text-right font-mono font-medium text-white text-xs whitespace-nowrap">
                                                    {formatRupiah(p.selling_price)}
                                                </td>

                                                {/* Margin */}
                                                <td className="py-3 px-4 text-right font-mono text-emerald-400 text-xs whitespace-nowrap">
                                                    {margin}%
                                                </td>

                                                {/* Stok */}
                                                <td className="py-3 px-4 text-center font-mono tabular-nums whitespace-nowrap">
                                                    <span className={
                                                        isOutOfStock ? 'text-rose-400 font-semibold'
                                                        : isLowStock ? 'text-amber-400 font-medium'
                                                        : 'text-slate-300'
                                                    }>
                                                        {p.stock_qty}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 text-xs">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            isOutOfStock || !p.is_available ? 'bg-rose-500' : 'bg-emerald-400'
                                                        }`} />
                                                        {isOutOfStock || !p.is_available ? 'Habis' : 'Tersedia'}
                                                    </span>
                                                </td>

                                                {/* Aksi */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAdjustment(p)}
                                                        className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/[0.06] transition-colors"
                                                    >
                                                        Stok
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(p)}
                                                        className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/[0.06] transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(p)}
                                                        className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded hover:bg-rose-500/10 transition-colors"
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

            {/* ============================================================
                MODAL 1: PENYESUAIAN STOK (KONSISTEN DENGAN BERANDA)
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
                MODAL 2: EDIT PRODUK & HARGA (KONSISTEN DENGAN BERANDA)
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
                )}
            </AcrylicModal>

            {/* ============================================================
                MODAL 3: TAMBAH MENU BARU (KONSISTEN DENGAN BERANDA)
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
                MODAL 4: TAMBAH KATEGORI (KONSISTEN DENGAN BERANDA)
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
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <ScanLine className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">
                                Scanner Barcode Siap
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                                Jika menu sudah ada, jendela ubah stok akan terbuka. Jika belum ada, form tambah menu baru akan otomatis terisi barcode ini.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-200 block">
                            Atau Masukkan Nomor Barcode Manual:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                autoFocus
                                value={quickScanInput}
                                onChange={(e) => setQuickScanInput(e.target.value)}
                                placeholder="Contoh: 8991001234..."
                                className="flex-1 bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                MODAL 6: HAPUS PRODUK (KONSISTEN DENGAN BERANDA)
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
