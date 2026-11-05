import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    QrCode,
    Search,
    Clock,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Check,
    X,
    FileText,
    Banknote,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

export default function CashierPos({
    active_shift,
    products = [],
    categories = [],
    dining_tables = [],
    fulfillment_orders = [],
}) {
    // Category & Search filter
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Cart state
    const [cart, setCart] = useState([]);
    const [orderSource, setOrderSource] = useState('cashier_direct'); // 'cashier_direct' | 'qr_table'
    const [selectedTableId, setSelectedTableId] = useState('');
    const [customerName, setCustomerName] = useState('Pelanggan Walk-in');

    // Modals state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
    const [expandedNotesId, setExpandedNotesId] = useState(null);

    // Custom alert/notification modal (Replacing native browser alert)
    const [noticeModal, setNoticeModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning', // 'warning' | 'error' | 'info'
    });

    const showNotice = (title, message, type = 'warning') => {
        setNoticeModal({ isOpen: true, title, message, type });
    };

    const closeNotice = () => {
        setNoticeModal((prev) => ({ ...prev, isOpen: false }));
    };

    // Forms
    const {
        data: checkoutData,
        setData: setCheckoutData,
        post: postCheckout,
        processing: checkoutProcessing,
        errors: checkoutErrors,
        reset: resetCheckout,
    } = useForm({
        items: [],
        payment_method: 'tunai', // 'tunai' | 'qris'
        amount_received: 0,
        table_id: '',
        customer_name: 'Pelanggan Walk-in',
        order_source: 'cashier_direct',
    });

    const {
        data: openShiftData,
        setData: setOpenShiftData,
        post: postOpenShift,
        processing: openShiftProcessing,
        errors: openShiftErrors,
        reset: resetOpenShift,
    } = useForm({
        shift_name: 'Shift Siang',
        opening_cash: 200000,
        notes: '',
    });

    const {
        data: closeShiftData,
        setData: setCloseShiftData,
        post: postCloseShift,
        processing: closeShiftProcessing,
        errors: closeShiftErrors,
        reset: resetCloseShift,
    } = useForm({
        closing_cash_actual: 0,
        notes: '',
    });

    // Barcode scanner integration: scanning a barcode instantly adds the item to the cart
    const handleBarcodeDetected = (barcode) => {
        const item = products.find((p) => p.barcode === barcode);
        if (item) {
            addToCart(item);
        } else {
            setSearchQuery(barcode);
        }
    };

    const { scannerStatus, lastScannedBarcode } = useBarcodeScanner(handleBarcodeDetected);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCategory =
                selectedCategory === 'all' || p.category_id === Number(selectedCategory);
            const query = searchQuery.toLowerCase().trim();
            const matchQuery =
                !query ||
                p.product_name.toLowerCase().includes(query) ||
                (p.barcode && p.barcode.toLowerCase().includes(query));
            return matchCategory && matchQuery;
        });
    }, [products, selectedCategory, searchQuery]);

    // Cart calculations
    const cartTotals = useMemo(() => {
        const totalAmount = cart.reduce(
            (sum, item) => sum + Number(item.selling_price) * item.quantity,
            0
        );
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        return { totalAmount, totalItems };
    }, [cart]);

    const addToCart = (product) => {
        if (product.stock_qty <= 0 || !product.is_available) {
            showNotice(
                'Menu Tidak Tersedia',
                `Menu "${product.product_name}" saat ini sedang habis atau tidak aktif untuk dijual.`,
                'warning'
            );
            return;
        }

        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_qty) {
                    showNotice(
                        'Batas Stok Menu Tercapai',
                        `Menu "${product.product_name}" hanya tersisa ${product.stock_qty} unit di gudang/dapur. Anda tidak dapat menambahkan lebih dari stok yang ada.`,
                        'warning'
                    );
                    return prev;
                }
                return prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    id: product.id,
                    product_id: product.id,
                    product_name: product.product_name,
                    selling_price: Number(product.selling_price),
                    stock_qty: product.stock_qty,
                    requires_kitchen: product.requires_kitchen,
                    quantity: 1,
                    notes: '',
                },
            ];
        });
    };

    const updateCartQty = (productId, delta) => {
        setCart((prev) => {
            const target = prev.find((i) => i.id === productId);
            if (!target) return prev;

            const newQty = target.quantity + delta;
            if (newQty > target.stock_qty) {
                showNotice(
                    'Stok Tidak Mencukupi',
                    `Jumlah menu "${target.product_name}" tidak dapat ditambah lagi karena stok fisik yang tersedia hanya ${target.stock_qty} unit.`,
                    'warning'
                );
                return prev;
            }

            return prev
                .map((i) => {
                    if (i.id === productId) {
                        return newQty > 0 ? { ...i, quantity: newQty } : null;
                    }
                    return i;
                })
                .filter(Boolean);
        });
    };

    const updateCartNotes = (productId, notes) => {
        setCart((prev) =>
            prev.map((i) => (i.id === productId ? { ...i, notes } : i))
        );
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((i) => i.id !== productId));
    };

    const handleConfirmClearCart = () => {
        setCart([]);
        setIsClearCartModalOpen(false);
    };

    // Open Checkout Modal
    const handleOpenPayment = () => {
        if (cart.length === 0) return;
        setCheckoutData({
            items: cart.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
                notes: i.notes || null,
            })),
            payment_method: 'tunai',
            amount_received: cartTotals.totalAmount,
            table_id: orderSource === 'qr_table' ? selectedTableId : null,
            customer_name: customerName || 'Pelanggan Walk-in',
            order_source: orderSource,
        });
        setIsPaymentModalOpen(true);
    };

    const handleQuickCash = (amount) => {
        setCheckoutData('amount_received', amount);
    };

    const handleSubmitCheckout = (e) => {
        e.preventDefault();
        postCheckout('/pos/checkout', {
            preserveScroll: true,
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                setCart([]);
                resetCheckout();
            },
        });
    };

    // Handshake: Cashier marks order as served
    const handleServeOrder = (orderId) => {
        router.post(`/pos/orders/${orderId}/serve`, {}, { preserveScroll: true });
    };

    const handleSubmitOpenShift = (e) => {
        e.preventDefault();
        postOpenShift('/pos/shift/open', {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpenShiftModalOpen(false);
                resetOpenShift();
            },
        });
    };

    const handleSubmitCloseShift = (e) => {
        e.preventDefault();
        if (!active_shift) return;
        postCloseShift(`/pos/shift/${active_shift.id}/close`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCloseShiftModalOpen(false);
                resetCloseShift();
            },
        });
    };

    const isUnderpaid =
        checkoutData.payment_method === 'tunai' &&
        Number(checkoutData.amount_received) < cartTotals.totalAmount;

    const changeAmount = Math.max(
        0,
        Number(checkoutData.amount_received) - cartTotals.totalAmount
    );

    const shortfallAmount = Math.max(
        0,
        cartTotals.totalAmount - Number(checkoutData.amount_received)
    );

    // Live Shift Reconciliation calculations
    const expectedShiftCash = active_shift
        ? Number(active_shift.opening_cash) + Number(active_shift.total_cash_sales)
        : 0;
    const actualShiftCash = Number(closeShiftData.closing_cash_actual) || 0;
    const shiftDiff = actualShiftCash - expectedShiftCash;

    return (
        <AuthenticatedLayout
            title="Kasir POS Terminal"
            scannerStatus={scannerStatus}
            lastScannedBarcode={lastScannedBarcode}
            showSearch={false}
            headerRight={
                active_shift ? (
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        icon={Clock}
                        onClick={() => {
                            setCloseShiftData(
                                'closing_cash_actual',
                                Number(active_shift.opening_cash) + Number(active_shift.total_cash_sales)
                            );
                            setIsCloseShiftModalOpen(true);
                        }}
                    >
                        <span>Tutup Shift ({active_shift.shift_name})</span>
                    </SpecularButton>
                ) : null
            }
        >
            <Head title="Kasir POS - Terminal Penjualan & Transaksi" />

            {/* Shift Inactive Warning Banner */}
            {!active_shift && (
                <div className="bg-[#0C0E16] border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                            <h2 className="text-base font-semibold text-amber-200">
                                Sesi Shift Kasir Belum Dibuka
                            </h2>
                            <p className="text-sm text-slate-300 mt-0.5">
                                Harap masukkan modal awal kasir sebelum melayani transaksi agar rekapitulasi kas harian tetap akurat.
                            </p>
                        </div>
                    </div>
                    <SpecularButton
                        variant="primary"
                        size="md"
                        onClick={() => setIsOpenShiftModalOpen(true)}
                        className="shrink-0"
                    >
                        Buka Shift Sekarang
                    </SpecularButton>
                </div>
            )}

            {/* Fulfillment Notification Bar (Kitchen Handshake: Ready Orders) */}
            {fulfillment_orders.length > 0 && (
                <div className="bg-[#0C0E16] border border-emerald-500/30 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="text-sm font-semibold text-emerald-300">
                                Pesanan Siap Diserahkan dari Dapur
                            </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                            {fulfillment_orders.length} Antrean Siap
                        </span>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                        {fulfillment_orders.map((ord) => (
                            <div
                                key={ord.id}
                                className="shrink-0 px-4 py-3 rounded-lg bg-[#08090D] border border-emerald-500/25 flex items-center gap-4"
                            >
                                <div>
                                    <span className="font-mono font-bold text-emerald-400 text-base block">
                                        #{ord.token_number}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium block">
                                        {ord.table ? `Meja ${ord.table.table_number}` : 'Bungkus / Takeaway'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleServeOrder(ord.id)}
                                    className="min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                                    title="Konfirmasi bahwa makanan telah diterima pelanggan"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Serahkan</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main POS Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* =========================================================
                    LEFT: PRODUCT CATALOG & FILTER (7 COLS)
                   ========================================================= */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Search & Category Filter Card */}
                    <div className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4">
                        {/* Search Input with Clear Button */}
                        <div className="relative">
                            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama menu atau scan barcode..."
                                className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg pl-11 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="w-8 h-8 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-white"
                                    aria-label="Hapus kata kunci pencarian"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Buttons */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === 'all'
                                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                        : 'bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.07] border border-white/[0.06]'
                                }`}
                            >
                                Semua Menu
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(c.id)}
                                    className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedCategory === c.id
                                            ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                            : 'bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.07] border border-white/[0.06]'
                                    }`}
                                >
                                    {c.category_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-400 bg-[#0C0E16] rounded-xl border border-white/[0.08] p-8 space-y-2">
                                <p className="text-base font-semibold text-slate-300">
                                    Menu tidak ditemukan
                                </p>
                                <p className="text-sm text-slate-500">
                                    Coba ganti kategori atau periksa kembali kata kunci pencarian Anda.
                                </p>
                            </div>
                        ) : (
                            filteredProducts.map((p) => {
                                const isOutOfStock = p.stock_qty <= 0 || !p.is_available;
                                const isLowStock = p.stock_qty > 0 && p.stock_qty <= 5;

                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => addToCart(p)}
                                        className={`p-4 rounded-xl text-left border flex flex-col justify-between min-h-[148px] relative select-none transition-all ${
                                            isOutOfStock
                                                ? 'bg-[#0C0E16]/40 border-white/[0.04] opacity-50 cursor-not-allowed'
                                                : 'bg-[#0C0E16] hover:bg-[#121520] border-white/[0.08] hover:border-indigo-500/40 active:scale-[0.99] cursor-pointer shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-2 gap-2 min-w-0">
                                                <span className="font-mono text-slate-400 tracking-wider truncate min-w-0 flex-1">
                                                    {p.barcode || 'NO-BARCODE'}
                                                </span>
                                                {p.requires_kitchen ? (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                                        Dapur
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/[0.06] text-slate-300 border border-white/[0.08] shrink-0">
                                                        Instan
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                                                {p.product_name}
                                            </h4>
                                        </div>

                                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between mt-2">
                                            <span className="font-mono font-bold text-sm text-white tabular-nums">
                                                {formatRupiah(p.selling_price)}
                                            </span>
                                            {isOutOfStock ? (
                                                <span className="text-xs font-mono font-semibold text-rose-400">
                                                    Habis
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="text-xs font-mono font-semibold text-amber-300 tabular-nums">
                                                    Sisa {p.stock_qty}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-400 tabular-nums">
                                                    {p.stock_qty} unit
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* =========================================================
                    RIGHT: ACTIVE CART & ORDER FULFILLMENT (5 COLS)
                   ========================================================= */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#0C0E16] border border-white/[0.08] rounded-xl overflow-hidden">
                        {/* Cart Header */}
                        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-base font-semibold text-white">
                                    Keranjang Pesanan
                                </h3>
                                {cart.length > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {cartTotals.totalItems} item
                                    </span>
                                )}
                            </div>
                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsClearCartModalOpen(true)}
                                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-medium"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>

                        {/* Cart Content */}
                        <div className="p-5 space-y-4">
                            {/* Order Source Switcher (Takeaway vs Dine-in) */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-slate-300 block">
                                    Jenis Pelayanan:
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-[#08090D] border border-white/[0.08] rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setOrderSource('cashier_direct')}
                                        className={`min-h-[44px] text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                                            orderSource === 'cashier_direct'
                                                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Bungkus / Takeaway
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderSource('qr_table')}
                                        className={`min-h-[44px] text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                                            orderSource === 'qr_table'
                                                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Makan di Meja
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {orderSource === 'qr_table' && (
                                        <div>
                                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                                Nomor Meja:
                                            </label>
                                            <select
                                                value={selectedTableId}
                                                onChange={(e) => setSelectedTableId(e.target.value)}
                                                className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Pilih Nomor Meja</option>
                                                {dining_tables.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        Meja {t.table_number} ({t.status})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className={orderSource === 'qr_table' ? '' : 'col-span-2'}>
                                        <label className="text-xs font-medium text-slate-300 block mb-1">
                                            Nama Pelanggan:
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Pelanggan Walk-in"
                                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 space-y-2">
                                        <ShoppingCart className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                                        <p className="text-sm font-medium text-slate-300">
                                            Belum ada item di keranjang
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Pilih menu dari katalog di sebelah kiri atau scan barcode.
                                        </p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3.5 rounded-lg bg-[#08090D] border border-white/[0.08] space-y-2.5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">
                                                        {item.product_name}
                                                    </div>
                                                    <div className="text-xs font-mono text-slate-400 tabular-nums">
                                                        {formatRupiah(item.selling_price)} / unit
                                                    </div>
                                                </div>
                                                <div className="text-right font-mono font-bold text-white text-sm tabular-nums shrink-0">
                                                    {formatRupiah(item.selling_price * item.quantity)}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                                                {/* Accessible Stepper */}
                                                <div className="flex items-center bg-[#0C0E16] border border-white/[0.1] rounded-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQty(item.id, -1)}
                                                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-l-lg transition-colors active:scale-95"
                                                        aria-label="Kurangi jumlah"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-mono font-bold text-sm text-white tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQty(item.id, 1)}
                                                        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-r-lg transition-colors active:scale-95"
                                                        aria-label="Tambah jumlah"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Notes & Delete */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedNotesId(
                                                                expandedNotesId === item.id ? null : item.id
                                                             )
                                                        }
                                                        className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg flex items-center gap-1 transition-colors"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        <span>{item.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        aria-label="Hapus item dari keranjang"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedNotesId === item.id && (
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) => updateCartNotes(item.id, e.target.value)}
                                                    placeholder="Contoh: Es sedikit, tidak pakai gula"
                                                    className="w-full h-10 bg-[#0C0E16] border border-white/[0.08] rounded-lg px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                                />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Total Bill Box */}
                            <div className="p-4 rounded-xl bg-[#08090D] border border-white/[0.08] space-y-2.5">
                                <div className="flex items-center justify-between text-sm text-slate-400 font-mono">
                                    <span>Total Item:</span>
                                    <span className="text-white font-bold tabular-nums">
                                        {cartTotals.totalItems} unit
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                                        Total Tagihan
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                                        {formatRupiah(cartTotals.totalAmount)}
                                    </span>
                                </div>
                            </div>

                            {/* Checkout CTA */}
                            <SpecularButton
                                variant="primary"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={handleOpenPayment}
                                className="w-full min-h-[52px] text-base font-semibold"
                                icon={ArrowRight}
                                iconPosition="right"
                            >
                                Konfirmasi Pesanan & Bayar
                            </SpecularButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================
                MODAL 1: KONFIRMASI PEMBAYARAN & HITUNG KEMBALIAN
               ========================================================= */}
            <AcrylicModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Konfirmasi Pembayaran Kasir"
                subtitle={`Total Tagihan: ${formatRupiah(cartTotals.totalAmount)} (${cartTotals.totalItems} item dipilih)`}
                maxWidth="max-w-xl"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsPaymentModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            disabled={isUnderpaid}
                            loading={checkoutProcessing}
                            onClick={handleSubmitCheckout}
                            icon={Check}
                        >
                            Selesaikan & Cetak Struk
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCheckout} className="space-y-5">
                    {/* Ringkasan Singkat Pelanggan & Meja */}
                    <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                        <div>
                            <span className="text-slate-400 block font-medium">Pelanggan:</span>
                            <span className="text-white font-semibold text-sm">
                                {customerName || 'Pelanggan Walk-in'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block font-medium">Layanan:</span>
                            <span className="text-indigo-300 font-semibold text-sm">
                                {orderSource === 'qr_table'
                                    ? `Makan di Meja (Meja ${
                                          dining_tables.find((t) => String(t.id) === String(selectedTableId))
                                              ?.table_number || '-'
                                      })`
                                    : 'Bungkus / Takeaway'}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="text-sm font-medium text-slate-200 block mb-2">
                            Pilih Metode Pembayaran:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutData('payment_method', 'tunai');
                                    setCheckoutData('amount_received', cartTotals.totalAmount);
                                }}
                                className={`min-h-[50px] py-2 px-4 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-2.5 ${
                                    checkoutData.payment_method === 'tunai'
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                        : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                }`}
                            >
                                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>Uang Tunai (Cash)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutData('payment_method', 'qris');
                                    setCheckoutData('amount_received', cartTotals.totalAmount);
                                }}
                                className={`min-h-[50px] py-2 px-4 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-2.5 ${
                                    checkoutData.payment_method === 'qris'
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                        : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                }`}
                            >
                                <QrCode className="w-5 h-5 text-indigo-300 shrink-0" />
                                <span>QRIS Dinamis</span>
                            </button>
                        </div>
                    </div>

                    {/* QRIS Display Container */}
                    {checkoutData.payment_method === 'qris' && (
                        <div className="p-6 rounded-xl bg-[#08090D] border border-white/[0.08] text-center space-y-3">
                            <div className="w-32 h-32 mx-auto rounded-xl bg-white p-3 flex items-center justify-center shadow-lg">
                                <QrCode className="w-28 h-28 text-slate-900" />
                            </div>
                            <div>
                                <span className="text-base text-indigo-300 font-semibold block">
                                    QRIS Siap Dipindai Pelanggan
                                </span>
                                <span className="text-xs text-slate-400 block mt-1">
                                    Tunjukkan kode QR kepada pelanggan. Mendukung GoPay, OVO, Dana, ShopeePay, BCA, dan m-Banking lainnya.
                                </span>
                            </div>
                            <div className="pt-2 border-t border-white/[0.06] text-sm font-mono text-slate-200">
                                Nominal Pas:{' '}
                                <span className="text-white font-bold">{formatRupiah(cartTotals.totalAmount)}</span>
                            </div>
                        </div>
                    )}

                    {/* Cash Calculator & Quick Presets */}
                    {checkoutData.payment_method === 'tunai' && (
                        <div className="space-y-4">
                            <AcrylicInput
                                label="Uang Fisik Diterima dari Pelanggan (Rp)"
                                type="number"
                                min={cartTotals.totalAmount}
                                value={checkoutData.amount_received}
                                onChange={(e) =>
                                    setCheckoutData('amount_received', parseFloat(e.target.value) || 0)
                                }
                                error={checkoutErrors.amount_received}
                                inputClassName="text-base font-mono font-bold"
                                required
                            />

                            {/* Quick Preset Buttons */}
                            <div>
                                <label className="text-xs text-slate-400 block mb-2 font-medium">
                                    Pecahan Uang Cepat (Klik untuk memilih nominal):
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCash(cartTotals.totalAmount)}
                                        className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                                            Number(checkoutData.amount_received) === cartTotals.totalAmount
                                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                                                : 'bg-[#08090D] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
                                        }`}
                                    >
                                        Uang Pas
                                    </button>
                                    {[20000, 50000, 100000, 200000].map((nominal) => {
                                        const isSelected = Number(checkoutData.amount_received) === nominal;
                                        return (
                                            <button
                                                key={nominal}
                                                type="button"
                                                onClick={() => handleQuickCash(nominal)}
                                                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                                                    isSelected
                                                        ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                                                        : 'bg-[#08090D] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
                                                }`}
                                            >
                                                {formatRupiah(nominal)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Underpayment Alert Box */}
                            {isUnderpaid && (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block">Uang Diterima Kurang!</span>
                                        <span className="text-xs text-rose-300/90 block mt-0.5">
                                            Uang yang dimasukkan masih kurang {formatRupiah(shortfallAmount)} dari total tagihan ({formatRupiah(cartTotals.totalAmount)}).
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Change Box */}
                            <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 block">
                                        Uang Kembalian Pelanggan
                                    </span>
                                    <span className="text-xs text-slate-400 mt-0.5 block">
                                        Wajib diserahkan ke pelanggan
                                    </span>
                                </div>
                                <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tabular-nums">
                                    {formatRupiah(changeAmount)}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL 2: BUKA SHIFT BARU
               ========================================================= */}
            <AcrylicModal
                isOpen={isOpenShiftModalOpen}
                onClose={() => setIsOpenShiftModalOpen(false)}
                title="Buka Sesi Shift Kasir Baru"
                subtitle="Mulai sesi kasir baru dan masukkan modal awal uang fisik di laci kasir."
                maxWidth="max-w-lg"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsOpenShiftModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={openShiftProcessing}
                            onClick={handleSubmitOpenShift}
                        >
                            Buka Sesi Shift
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitOpenShift} className="space-y-4">
                    {/* Info Box */}
                    <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.08] text-xs text-slate-300 space-y-1">
                        <span className="font-semibold text-white block">Petunjuk Kasir:</span>
                        <p className="text-slate-400 leading-relaxed">
                            Modal awal kasir digunakan sebagai uang kembalian untuk transaksi tunai awal dan dasar perhitungan rekonsiliasi saat tutup shift.
                        </p>
                    </div>

                    {/* Nama Shift dengan Preset Cepat */}
                    <div className="space-y-2">
                        <AcrylicInput
                            label="Nama Shift"
                            value={openShiftData.shift_name}
                            onChange={(e) => setOpenShiftData('shift_name', e.target.value)}
                            placeholder="Contoh: Shift Pagi, Shift Siang"
                            error={openShiftErrors.shift_name}
                            required
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-400 mr-1">Pilihan Cepat:</span>
                            {['Shift Pagi', 'Shift Siang', 'Shift Malam'].map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setOpenShiftData('shift_name', name)}
                                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                        openShiftData.shift_name === name
                                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                                            : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Modal Awal Kasir dengan Preset Nominal */}
                    <div className="space-y-2">
                        <AcrylicInput
                            label="Modal Awal Kasir (Opening Cash Rp)"
                            type="number"
                            min="0"
                            value={openShiftData.opening_cash}
                            onChange={(e) =>
                                setOpenShiftData('opening_cash', parseFloat(e.target.value) || 0)
                            }
                            error={openShiftErrors.opening_cash}
                            inputClassName="font-mono text-base font-bold"
                            required
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-400 mr-1">Pecahan Cepat:</span>
                            {[100000, 200000, 300000, 500000].map((nominal) => (
                                <button
                                    key={nominal}
                                    type="button"
                                    onClick={() => setOpenShiftData('opening_cash', nominal)}
                                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                                        Number(openShiftData.opening_cash) === nominal
                                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                                            : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {formatRupiah(nominal)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AcrylicInput
                        label="Catatan Tambahan (Opsional)"
                        value={openShiftData.notes}
                        onChange={(e) => setOpenShiftData('notes', e.target.value)}
                        placeholder="Misal: Kondisi laci uang rapi, uang kembalian pecahan lengkap"
                    />
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL 3: TUTUP SHIFT KASIR & REKONSILIASI KAS
               ========================================================= */}
            <AcrylicModal
                isOpen={isCloseShiftModalOpen}
                onClose={() => setIsCloseShiftModalOpen(false)}
                title="Tutup Sesi Shift Kasir"
                subtitle={active_shift ? `Rekonsiliasi Kas: ${active_shift.shift_name}` : ''}
                maxWidth="max-w-lg"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsCloseShiftModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            loading={closeShiftProcessing}
                            onClick={handleSubmitCloseShift}
                        >
                            Tutup & Kunci Shift
                        </SpecularButton>
                    </>
                }
            >
                {active_shift && (
                    <form onSubmit={handleSubmitCloseShift} className="space-y-4">
                        {/* Summary Shift Card */}
                        <div className="p-4 rounded-xl bg-[#08090D] border border-white/[0.08] text-sm font-mono space-y-2">
                            <div className="flex justify-between text-slate-400">
                                <span>Modal Awal Kasir:</span>
                                <span className="text-white font-medium">
                                    {formatRupiah(active_shift.opening_cash)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Total Penjualan Tunai:</span>
                                <span className="text-white font-medium">
                                    +{formatRupiah(active_shift.total_cash_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Total Penjualan QRIS:</span>
                                <span className="text-indigo-300 font-medium">
                                    +{formatRupiah(active_shift.total_qris_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-white/[0.08]">
                                <span>Target Fisik Tunai di Laci:</span>
                                <span className="text-emerald-400 font-bold text-base">
                                    {formatRupiah(expectedShiftCash)}
                                </span>
                            </div>
                        </div>

                        {/* Input Hasil Hitungan Kasir */}
                        <div className="space-y-2">
                            <AcrylicInput
                                label="Uang Fisik Aktual di Laci Kasir (Closing Cash Rp)"
                                type="number"
                                min="0"
                                value={closeShiftData.closing_cash_actual}
                                onChange={(e) =>
                                    setCloseShiftData('closing_cash_actual', parseFloat(e.target.value) || 0)
                                }
                                error={closeShiftErrors.closing_cash_actual}
                                inputClassName="font-mono text-base font-bold"
                                required
                            />

                            {/* Status Selisih Kas Otomatis */}
                            {shiftDiff === 0 ? (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span>Kas Sesuai! Jumlah uang di laci sama persis dengan sistem (Selisih: Rp 0).</span>
                                </div>
                            ) : shiftDiff < 0 ? (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                                    <span>
                                        Terdapat Selisih Kurang sebesar{' '}
                                        <strong className="font-mono font-bold text-rose-200">
                                            {formatRupiah(Math.abs(shiftDiff))}
                                        </strong>
                                        . Mohon tuliskan alasannya pada kolom catatan.
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>
                                        Terdapat Selisih Lebih sebesar{' '}
                                        <strong className="font-mono font-bold text-amber-200">
                                            +{formatRupiah(shiftDiff)}
                                        </strong>
                                        . Mohon tuliskan alasannya pada kolom catatan.
                                    </span>
                                </div>
                            )}
                        </div>

                        <AcrylicInput
                            label="Keterangan / Alasan Selisih Kas (Jika Ada)"
                            value={closeShiftData.notes}
                            onChange={(e) => setCloseShiftData('notes', e.target.value)}
                            placeholder="Misal: Uang kembalian receh kurang, fisik cocok"
                        />
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================
                MODAL 4: NOTIFIKASI OPERASIONAL KASIR (PENGGANTI ALERT)
               ========================================================= */}
            <AcrylicModal
                isOpen={noticeModal.isOpen}
                onClose={closeNotice}
                title={noticeModal.title || 'Pemberitahuan Kasir'}
                maxWidth="max-w-md"
                footer={
                    <SpecularButton
                        variant="primary"
                        size="md"
                        onClick={closeNotice}
                        className="w-full sm:w-auto"
                    >
                        Saya Mengerti
                    </SpecularButton>
                }
            >
                <div
                    className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                        noticeModal.type === 'error'
                            ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                    }`}
                >
                    {noticeModal.type === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">
                            {noticeModal.title}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {noticeModal.message}
                        </p>
                    </div>
                </div>
            </AcrylicModal>

            {/* =========================================================
                MODAL 5: KONFIRMASI KOSONGKAN KERANJANG (PENGGANTI CONFIRM)
               ========================================================= */}
            <AcrylicModal
                isOpen={isClearCartModalOpen}
                onClose={() => setIsClearCartModalOpen(false)}
                title="Kosongkan Keranjang Pesanan?"
                subtitle="Konfirmasi penghapusan seluruh menu transaksi saat ini."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsClearCartModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            onClick={handleConfirmClearCart}
                        >
                            Ya, Kosongkan Keranjang
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 space-y-2">
                    <div className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Hapus Seluruh Item Pesanan</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Seluruh <strong className="text-white font-mono">{cartTotals.totalItems} item</strong> senilai{' '}
                        <strong className="text-white font-mono">{formatRupiah(cartTotals.totalAmount)}</strong> yang telah dipilih akan dihapus dari transaksi saat ini.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Tindakan ini tidak dapat dibatalkan dan Anda harus memilih ulang menu jika ingin melanjutkan.
                    </p>
                </div>
            </AcrylicModal>
        </AuthenticatedLayout>
    );
}
