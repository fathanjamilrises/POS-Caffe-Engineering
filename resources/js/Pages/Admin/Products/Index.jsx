import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    SlidersHorizontal,
    QrCode,
    ScanLine,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    RefreshCw,
    Check,
    Layers,
    X,
    FolderPlus,
    ArrowUpDown,
    ExternalLink,
} from 'lucide-react';

import AdminAcrylicLayout from '@/Layouts/AdminAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
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
    const [barcodeCheckMessage, setBarcodeCheckMessage] = useState(null);

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
        cost_price: 0,
        selling_price: 0,
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

        // If create modal is already open, auto-fill the barcode field!
        if (isCreateModalOpen) {
            setCreateData('barcode', cleanCode);
            return;
        }

        // If edit modal is open, fill edit barcode
        if (isEditModalOpen) {
            setEditData('barcode', cleanCode);
            return;
        }

        // Otherwise check if product exists in current page or database
        const existing = products.data.find((p) => p.barcode === cleanCode);
        if (existing) {
            handleOpenAdjustment(existing);
        } else {
            // Unregistered barcode: open Create Product modal with this barcode prefilled!
            resetCreate();
            setCreateData({
                category_id: categories?.[0]?.id || '',
                barcode: cleanCode,
                product_name: '',
                cost_price: 0,
                selling_price: 0,
                stock_qty: 10,
                requires_kitchen: false,
                is_available: true,
            });
            setIsCreateModalOpen(true);
        }
    };

    const { scannerStatus, lastScannedBarcode } = useBarcodeScanner(handleBarcodeDetected);

    // Open Create Modal
    const handleOpenCreate = (prefilledBarcode = '') => {
        resetCreate();
        setCreateData({
            category_id: categories?.[0]?.id || '',
            barcode: prefilledBarcode || '',
            product_name: '',
            cost_price: 0,
            selling_price: 0,
            stock_qty: 10,
            requires_kitchen: false,
            is_available: true,
        });
        setBarcodeCheckMessage(null);
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
            quantity_change: 1,
            notes: '',
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

    // Calculate Margin Percentage
    const calculateMargin = (cost, selling) => {
        const c = Number(cost) || 0;
        const s = Number(selling) || 0;
        if (s <= 0) return 0;
        return Math.round(((s - c) / s) * 100);
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

    return (
        <AdminAcrylicLayout
            title="Kelola Produk & Stok"
            scannerStatus={scannerStatus}
            lastScannedBarcode={lastScannedBarcode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => triggerFilter({ search: q })}
            headerRight={
                <div className="flex items-center gap-2">
                    <SpecularButton
                        variant="secondary"
                        size="sm"
                        icon={ScanLine}
                        onClick={() => setIsQuickScanModalOpen(true)}
                    >
                        <span>Scan Barcode</span>
                    </SpecularButton>
                    <SpecularButton
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => handleOpenCreate()}
                    >
                        <span>Tambah Produk</span>
                    </SpecularButton>
                </div>
            }
        >
            <Head title="Kelola Produk & Stok - Kasir App Admin" />

            <div className="space-y-6">
                {/* =========================================================================
                    TOP BENTO GRID: PRODUCT SUMMARY METRICS
                   ========================================================================= */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Total Katalog Produk</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.total_products}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            Semua varian menu terdaftar
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Stok Aman (Tersedia)</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.available_products}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                            Stok &gt; 5 porsi
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Stok Menipis (Kritis)</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.low_stock_products}
                        </div>
                        <div className="text-[11px] text-amber-400 mt-0.5 font-mono">
                            Sisa 1 s/d 5 porsi
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Produk Habis</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.out_of_stock_products}
                        </div>
                        <div className="text-[11px] text-rose-400 mt-0.5 font-mono">
                            Stok 0 / Nonaktif
                        </div>
                    </div>
                </div>

                {/* =========================================================================
                    FILTER TOOLBAR & ACTIONS
                   ========================================================================= */}
                <div className="p-3 bg-[#0B0D13] border border-white/[0.06] rounded-xl space-y-3">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') triggerFilter({ search: e.target.value });
                                }}
                                placeholder="Cari nama menu atau barcode..."
                                className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                            />
                        </div>

                        {/* Category & Status Filters */}
                        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    triggerFilter({ category_id: e.target.value });
                                }}
                                className="bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name} ({c.products_count})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={processFilter}
                                onChange={(e) => {
                                    setProcessFilter(e.target.value);
                                    triggerFilter({ requires_kitchen: e.target.value });
                                }}
                                className="bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Proses</option>
                                <option value="true">Dapur (KDS)</option>
                                <option value="false">Instan (Minuman/Snack)</option>
                            </select>

                            <select
                                value={stockFilter}
                                onChange={(e) => {
                                    setStockFilter(e.target.value);
                                    triggerFilter({ stock_status: e.target.value });
                                }}
                                className="bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Status</option>
                                <option value="available">Tersedia (&gt;5)</option>
                                <option value="low_stock">Menipis (&le;5)</option>
                                <option value="out_of_stock">Habis (0)</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/[0.06] flex items-center gap-1.5 transition-colors"
                                title="Tambah Kategori Baru"
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">+ Kategori</span>
                            </button>

                            <SpecularButton
                                variant="secondary"
                                size="sm"
                                icon={ScanLine}
                                onClick={() => setIsQuickScanModalOpen(true)}
                            >
                                <span className="hidden sm:inline">Scan Barcode</span>
                            </SpecularButton>

                            <SpecularButton
                                variant="primary"
                                size="sm"
                                icon={Plus}
                                onClick={() => handleOpenCreate()}
                            >
                                <span>+ Tambah Produk</span>
                            </SpecularButton>
                        </div>
                    </div>
                </div>

                {/* =========================================================================
                    DENSE PRODUCTS DATA TABLE
                   ========================================================================= */}
                <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                                    <th className="py-3 px-4">Barcode</th>
                                    <th className="py-3 px-4">Nama Produk</th>
                                    <th className="py-3 px-4">Kategori</th>
                                    <th className="py-3 px-4">Tipe Proses</th>
                                    <th className="py-3 px-4 text-right">HPP Modal</th>
                                    <th className="py-3 px-4 text-right">Harga Jual</th>
                                    <th className="py-3 px-4 text-right">Margin</th>
                                    <th className="py-3 px-4 text-center">Stok</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-16 text-center text-slate-500">
                                            <Package className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                                            <span className="block">Tidak ada produk yang sesuai dengan kriteria filter.</span>
                                            <div className="mt-3">
                                                <SpecularButton
                                                    variant="primary"
                                                    size="sm"
                                                    icon={Plus}
                                                    onClick={() => handleOpenCreate()}
                                                >
                                                    Tambah Produk Sekarang
                                                </SpecularButton>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((product) => {
                                        const isOutOfStock = product.stock_qty <= 0 || !product.is_available;
                                        const isLowStock = product.stock_qty > 0 && product.stock_qty <= 5;
                                        const margin = calculateMargin(product.cost_price, product.selling_price);

                                        return (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-white/[0.02] transition-colors group"
                                            >
                                                {/* Barcode */}
                                                <td className="py-3 px-4 font-mono text-slate-400">
                                                    {product.barcode || '-'}
                                                </td>

                                                {/* Name */}
                                                <td className="py-3 px-4 font-medium text-slate-200">
                                                    {product.product_name}
                                                </td>

                                                {/* Category */}
                                                <td className="py-3 px-4 text-slate-400">
                                                    {product.category?.category_name || '-'}
                                                </td>

                                                {/* Process Type */}
                                                <td className="py-3 px-4">
                                                    {product.requires_kitchen ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                                                            Dapur / KDS
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                                                            Instan
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Cost */}
                                                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                                                    {formatRupiah(product.cost_price)}
                                                </td>

                                                {/* Selling */}
                                                <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-slate-100">
                                                    {formatRupiah(product.selling_price)}
                                                </td>

                                                {/* Margin */}
                                                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                                                    +{margin}%
                                                </td>

                                                {/* Stock */}
                                                <td className="py-3 px-4 text-center font-mono tabular-nums">
                                                    <span
                                                        className={`font-semibold ${
                                                            isOutOfStock
                                                                ? 'text-rose-400'
                                                                : isLowStock
                                                                ? 'text-amber-400'
                                                                : 'text-slate-300'
                                                        }`}
                                                    >
                                                        {product.stock_qty}
                                                    </span>
                                                </td>

                                                {/* Status minimal 6px dot */}
                                                <td className="py-3 px-4">
                                                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                isOutOfStock ? 'bg-rose-500' : 'bg-emerald-400'
                                                            }`}
                                                        />
                                                        <span>{isOutOfStock ? 'Habis' : 'Tersedia'}</span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAdjustment(product)}
                                                            className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
                                                            title="Sesuaikan Jumlah Stok"
                                                        >
                                                            Stok
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(product)}
                                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                            title="Edit Menu"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDelete(product)}
                                                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                            title="Hapus Menu"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
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
                        <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                            <div>
                                Menampilkan{' '}
                                <span className="text-slate-200 font-mono">{products.data.length}</span> produk
                            </div>
                            <div className="flex items-center gap-1">
                                {products.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                                            link.active
                                                ? 'bg-white/[0.08] text-white font-medium border border-white/[0.12]'
                                                : link.url
                                                ? 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'
                                                : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================================================
                MODAL: TAMBAH PRODUK BARU (WITH INTEGRATED SCAN BARCODE HELPER)
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Produk / Menu Baru"
                subtitle="Masukkan informasi menu untuk katalog kasir POS dan menu QR meja."
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
                            Simpan ke Katalog
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <AcrylicInput
                                label="Nama Menu / Produk *"
                                placeholder="Contoh: Nasi Goreng Spesial, Es Teh Manis"
                                value={createData.product_name}
                                onChange={(e) => setCreateData('product_name', e.target.value)}
                                error={createErrors.product_name}
                                required
                            />
                        </div>

                        {/* Barcode with Quick Scan Trigger */}
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-medium text-slate-300 block">
                                Barcode Produk (Scan atau Ketik Manual)
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Scan barcode dengan scanner atau ketik nomor..."
                                        value={createData.barcode}
                                        onChange={(e) => setCreateData('barcode', e.target.value)}
                                        className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsQuickScanModalOpen(true);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors flex-shrink-0"
                                    title="Scan Barcode Cepat"
                                >
                                    <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Scan Barcode</span>
                                </button>
                            </div>
                            {createErrors.barcode && (
                                <p className="text-[11px] text-rose-400">{createErrors.barcode}</p>
                            )}
                            <p className="text-[10px] text-slate-500">
                                Tip: Gunakan hardware barcode scanner kapan saja untuk auto-fill field ini.
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                Kategori Menu *
                            </label>
                            <select
                                value={createData.category_id}
                                onChange={(e) => setCreateData('category_id', e.target.value)}
                                className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                                required
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                            {createErrors.category_id && (
                                <p className="text-[11px] text-rose-400 mt-1">{createErrors.category_id}</p>
                            )}
                        </div>

                        <div>
                            <AcrylicInput
                                label="Stok Awal *"
                                type="number"
                                min="0"
                                value={createData.stock_qty}
                                onChange={(e) => setCreateData('stock_qty', parseInt(e.target.value) || 0)}
                                error={createErrors.stock_qty}
                                required
                            />
                        </div>

                        <div>
                            <AcrylicInput
                                label="Harga Modal HPP (Rp) *"
                                type="number"
                                min="0"
                                value={createData.cost_price}
                                onChange={(e) => setCreateData('cost_price', parseFloat(e.target.value) || 0)}
                                error={createErrors.cost_price}
                                required
                            />
                        </div>

                        <div>
                            <AcrylicInput
                                label="Harga Jual (Rp) *"
                                type="number"
                                min="0"
                                value={createData.selling_price}
                                onChange={(e) => setCreateData('selling_price', parseFloat(e.target.value) || 0)}
                                error={createErrors.selling_price}
                                required
                            />
                        </div>
                    </div>

                    {/* Kitchen Processing & Availability Flags */}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                            <input
                                type="checkbox"
                                checked={createData.requires_kitchen}
                                onChange={(e) => setCreateData('requires_kitchen', e.target.checked)}
                                className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>
                                <strong>Memerlukan Proses Dapur / KDS</strong> (centang untuk makanan yang harus dimasak koki)
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                            <input
                                type="checkbox"
                                checked={createData.is_available}
                                onChange={(e) => setCreateData('is_available', e.target.checked)}
                                className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Menu langsung aktif dan dapat dipesan</span>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL: EDIT PRODUK
               ========================================================================= */}
            <AcrylicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Menu: ${selectedProduct?.product_name || ''}`}
                subtitle="Perbarui harga jual, HPP, atau pengaturan dapur."
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
                {selectedProduct && (
                    <form onSubmit={handleSubmitEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <AcrylicInput
                                    label="Nama Menu / Produk *"
                                    value={editData.product_name}
                                    onChange={(e) => setEditData('product_name', e.target.value)}
                                    error={editErrors.product_name}
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <AcrylicInput
                                    label="Barcode Produk"
                                    icon={QrCode}
                                    value={editData.barcode}
                                    onChange={(e) => setEditData('barcode', e.target.value)}
                                    error={editErrors.barcode}
                                    placeholder="Scan atau ketik barcode..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-300 block mb-1">
                                    Kategori Menu *
                                </label>
                                <select
                                    value={editData.category_id}
                                    onChange={(e) => setEditData('category_id', e.target.value)}
                                    className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <AcrylicInput
                                    label="Stok Tersedia *"
                                    type="number"
                                    min="0"
                                    value={editData.stock_qty}
                                    onChange={(e) => setEditData('stock_qty', parseInt(e.target.value) || 0)}
                                    error={editErrors.stock_qty}
                                    required
                                />
                            </div>

                            <div>
                                <AcrylicInput
                                    label="Harga Modal HPP (Rp) *"
                                    type="number"
                                    min="0"
                                    value={editData.cost_price}
                                    onChange={(e) => setEditData('cost_price', parseFloat(e.target.value) || 0)}
                                    error={editErrors.cost_price}
                                    required
                                />
                            </div>

                            <div>
                                <AcrylicInput
                                    label="Harga Jual (Rp) *"
                                    type="number"
                                    min="0"
                                    value={editData.selling_price}
                                    onChange={(e) => setEditData('selling_price', parseFloat(e.target.value) || 0)}
                                    error={editErrors.selling_price}
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={editData.requires_kitchen}
                                    onChange={(e) => setEditData('requires_kitchen', e.target.checked)}
                                    className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>Memerlukan Proses Dapur / KDS</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={editData.is_available}
                                    onChange={(e) => setEditData('is_available', e.target.checked)}
                                    className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>Status Menu Tersedia untuk Dipesan</span>
                            </label>
                        </div>
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================================
                MODAL: SESUAIKAN STOK (STOCK ADJUSTMENT)
               ========================================================================= */}
            <AcrylicModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                title="Penyesuaian Stok Menu"
                subtitle={selectedProduct ? `${selectedProduct.product_name} (Stok Saat Ini: ${selectedProduct.stock_qty})` : ''}
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
                            Simpan Perubahan Stok
                        </SpecularButton>
                    </>
                }
            >
                {selectedProduct && (
                    <form onSubmit={handleSubmitAdjustment} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                Jenis Penyesuaian
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'in', label: 'Barang Masuk (+)' },
                                    { id: 'out', label: 'Barang Keluar (-)' },
                                    { id: 'adjustment', label: 'Koreksi Fisik' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setAdjustmentData('movement_type', type.id)}
                                        className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                                            adjustmentData.movement_type === type.id
                                                ? 'bg-white/[0.08] border-indigo-400/40 text-white font-semibold'
                                                : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AcrylicInput
                            label="Jumlah Perubahan Stok *"
                            type="number"
                            min="1"
                            value={adjustmentData.quantity_change}
                            onChange={(e) =>
                                setAdjustmentData('quantity_change', parseInt(e.target.value) || 0)
                            }
                            error={adjustmentErrors.quantity_change}
                            required
                        />

                        {/* Calculation Preview */}
                        <div className="p-3 rounded-lg bg-[#07080B] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Estimasi Stok Akhir:</span>
                            <span className="text-slate-100 font-bold text-sm">
                                {previewCalculatedStock} porsi
                            </span>
                        </div>

                        <AcrylicInput
                            label="Keterangan / Alasan Penyesuaian"
                            placeholder="Contoh: Pembelian bahan baku tambahan, basi/rusak"
                            value={adjustmentData.notes}
                            onChange={(e) => setAdjustmentData('notes', e.target.value)}
                            error={adjustmentErrors.notes}
                        />
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================================
                MODAL: QUICK SCAN BARCODE HELPER
               ========================================================================= */}
            <AcrylicModal
                isOpen={isQuickScanModalOpen}
                onClose={() => setIsQuickScanModalOpen(false)}
                title="Scan Barcode Cepat"
                subtitle="Arahkan hardware scanner ke barcode atau ketik angka barcode di bawah."
                footer={
                    <SpecularButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsQuickScanModalOpen(false)}
                    >
                        Tutup
                    </SpecularButton>
                }
            >
                <form onSubmit={handleProcessQuickScan} className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#07080B] border border-white/[0.06] text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-indigo-400">
                            <ScanLine className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-slate-200">
                                Hardware Scanner Siap Mendengarkan
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                Jika produk sudah ada, form stok akan terbuka. Jika belum ada, form tambah produk baru akan terbuka.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300 block">
                            Atau Masukkan Nomor Barcode Manual:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                autoFocus
                                value={quickScanInput}
                                onChange={(e) => setQuickScanInput(e.target.value)}
                                placeholder="Contoh: 8991001234..."
                                className="flex-1 bg-[#07080B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                            />
                            <SpecularButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={!quickScanInput.trim()}
                            >
                                Proses
                            </SpecularButton>
                        </div>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL: TAMBAH KATEGORI BARU
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="Tambah Kategori Menu Baru"
                subtitle="Tambahkan kategori baru seperti Makanan Berat, Minuman Dingin, Snack."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCategoryModalOpen(false)}
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
                        label="Nama Kategori *"
                        placeholder="Contoh: Paket Hemat, Minuman Hangat"
                        value={categoryData.category_name}
                        onChange={(e) => setCategoryData('category_name', e.target.value)}
                        error={categoryErrors.category_name}
                        required
                    />
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL: KONFIRMASI HAPUS PRODUK
               ========================================================================= */}
            <AcrylicModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Produk dari Katalog"
                subtitle="Tindakan ini akan mengarsipkan produk sehingga tidak lagi muncul di kasir."
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
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        Yakin ingin menghapus menu{' '}
                        <strong>{selectedProduct?.product_name}</strong>? Data transaksi sebelumnya tetap tersimpan di riwayat keuangan.
                    </div>
                </div>
            </AcrylicModal>
        </AdminAcrylicLayout>
    );
}

