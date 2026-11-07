import React, { useState, useMemo, useEffect } from 'react';
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
    UtensilsCrossed,
    Coffee,
    Store,
    ShoppingBag,
    Layers,
    User,
    ScanBarcode,
    Bell,
    Receipt,
    History,
    Printer,
    RefreshCw,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';
import { toast } from '@/Services/toast';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Modern POS Cashier Terminal - Zero Whole-Page Scroll Edition.
 * Tailored for staff aged 40–60 operating on touchscreen tablets.
 * Pinned workstation view:
 * - 100vh locked viewport (zero whole-page scrolling).
 * - Independent scrollable catalog grid with pinned search & category chips.
 * - Independent scrollable digital receipt with permanently pinned bottom Pay Dock.
 * - High-contrast Obsidian Tanzanite styling & min >=44px touch targets.
 */
export default function CashierPos({
    active_shift,
    products = [],
    categories = [],
    dining_tables = [],
    fulfillment_orders = [],
    recent_transactions = [],
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
    const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
    const [selectedOrderForReprint, setSelectedOrderForReprint] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'unprocessed' | 'processing' | 'ready' | 'served'
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [expandedNotesId, setExpandedNotesId] = useState(null);

    // Auto-polling interval (every 6s) to sync kitchen readiness & transaction status in real-time
    useEffect(() => {
        const poll = setInterval(() => {
            router.reload({
                only: ['fulfillment_orders', 'recent_transactions', 'active_shift'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 6000);
        return () => clearInterval(poll);
    }, []);

    // Transaction breakdown by status for cashier tracking
    const unprocessedTransactions = useMemo(() => {
        return recent_transactions.filter((tx) => tx.order_status !== 'served' && tx.order_status !== 'cancelled');
    }, [recent_transactions]);

    const processingTransactions = useMemo(() => {
        return recent_transactions.filter((tx) => tx.order_status === 'processing');
    }, [recent_transactions]);

    const readyTransactions = useMemo(() => {
        return recent_transactions.filter((tx) => tx.order_status === 'ready');
    }, [recent_transactions]);

    const servedTransactions = useMemo(() => {
        return recent_transactions.filter((tx) => tx.order_status === 'served');
    }, [recent_transactions]);

    const filteredTransactions = useMemo(() => {
        return recent_transactions.filter((tx) => {
            // Status tab filter
            if (historyFilter === 'unprocessed') {
                if (tx.order_status === 'served' || tx.order_status === 'cancelled') return false;
            } else if (historyFilter !== 'all') {
                if (tx.order_status !== historyFilter) return false;
            }

            // Search query filter
            if (!historySearchQuery.trim()) return true;
            const query = historySearchQuery.toLowerCase();
            const tokenMatch = String(tx.token_number || '').toLowerCase().includes(query);
            const invoiceMatch = String(tx.invoice_number || '').toLowerCase().includes(query);
            const customerMatch = String(tx.customer_name || '').toLowerCase().includes(query);
            const tableMatch = tx.table ? String(tx.table.table_number || '').toLowerCase().includes(query) : false;
            const itemMatch = (tx.items || []).some((item) =>
                item.product?.product_name?.toLowerCase().includes(query)
            );

            return tokenMatch || invoiceMatch || customerMatch || tableMatch || itemMatch;
        });
    }, [recent_transactions, historyFilter, historySearchQuery]);

    // Non-blocking toast notification alert
    const showNotice = (title, message, type = 'warning') => {
        if (type === 'error') {
            toast.error(message, { title });
        } else if (type === 'info') {
            toast.info(message, { title });
        } else {
            toast.warning(message, { title });
        }
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
        shift_name: 'Shift Pagi',
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

    // Fast lookup for item quantity already in cart
    const cartQtyMap = useMemo(() => {
        const map = {};
        cart.forEach((i) => {
            map[i.product_id] = i.quantity;
        });
        return map;
    }, [cart]);

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
    const handleOpenPayment = (presetMethod = 'tunai') => {
        if (cart.length === 0) return;
        setCheckoutData({
            items: cart.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
                notes: i.notes || null,
            })),
            payment_method: presetMethod,
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

    // Keyboard shortcut (F8: Buka Pembayaran)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                if (cart.length > 0 && !isPaymentModalOpen) {
                    handleOpenPayment('tunai');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, isPaymentModalOpen, cartTotals]);

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
            title="Terminal Kasir POS"
            scannerStatus={scannerStatus}
            lastScannedBarcode={lastScannedBarcode}
            showSearch={false}
            isPosMode={true}
        >
            <Head title="Terminal Kasir POS - Enterprise Workstation" />

            {/* Locked 100vh Workstation Container (Zero Whole-Page Scroll) */}
            <div className="flex-1 h-full min-h-0 flex flex-col gap-2.5 overflow-hidden overflow-x-hidden select-none">
                {/* =========================================================
                    1. TOP STATUS RIBBON (COMPACT - HEIGHT 46px)
                   ========================================================= */}
                <div className="shrink-0 h-12 px-3 sm:px-4 rounded-xl bg-[#0C0E16] border border-white/[0.08] shadow-sm flex items-center justify-between gap-3">
                    {/* Left: Shift Info */}
                    {active_shift ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                                {active_shift.shift_name}
                            </span>
                            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 font-mono">
                                <span className="text-slate-600">|</span>
                                <span>
                                    Modal:{' '}
                                    <strong className="text-white">
                                        {formatRupiah(active_shift.opening_cash)}
                                    </strong>
                                </span>
                                <span className="text-slate-600">•</span>
                                <span>
                                    Kas Masuk:{' '}
                                    <strong className="text-emerald-400">
                                        +{formatRupiah(active_shift.total_cash_sales)}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Shift Belum Dibuka</span>
                        </div>
                    )}

                    {/* Right: Unified Action Buttons Group */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* 1. Riwayat Transaksi Button */}
                        <button
                            type="button"
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/[0.08] dark:text-slate-200 dark:hover:text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs dark:shadow-sm"
                            title="Buka riwayat transaksi kasir dan tracking status pesanan"
                        >
                            <History className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span className="hidden sm:inline">Riwayat Transaksi</span>
                            <span className="sm:hidden">Riwayat</span>
                            {unprocessedTransactions.length > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    {unprocessedTransactions.length} Belum Selesai
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06]">
                                    {recent_transactions.length}
                                </span>
                            )}
                        </button>

                        {/* 2. Kitchen Fulfillment Handshake Badge (HANYA muncul saat dapur sudah konfirmasi selesai masak / 'ready') */}
                        {fulfillment_orders.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsFulfillmentModalOpen(true)}
                                className="h-8 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:border-emerald-500/40 dark:text-emerald-300 active:scale-95 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs animate-pulse"
                                title="Pesanan telah selesai dimasak dapur dan siap diserahkan ke pelanggan"
                            >
                                <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{fulfillment_orders.length} Siap Saji</span>
                            </button>
                        )}

                        {/* 3. Shift Open/Close Action */}
                        {active_shift ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setCloseShiftData(
                                        'closing_cash_actual',
                                        Number(active_shift.opening_cash) +
                                            Number(active_shift.total_cash_sales)
                                    );
                                    setIsCloseShiftModalOpen(true);
                                }}
                                className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/[0.08] dark:text-slate-200 dark:hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                            >
                                <Banknote className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                <span>Tutup Shift</span>
                            </button>
                        ) : (
                            <SpecularButton
                                variant="primary"
                                size="sm"
                                onClick={() => setIsOpenShiftModalOpen(true)}
                                className="h-8 px-3 font-bold text-xs"
                            >
                                Buka Shift
                            </SpecularButton>
                        )}
                    </div>
                </div>

                {/* =========================================================
                    2. MAIN SPLIT WORKSTATION (FIXED HEIGHT - ZERO WHOLE PAGE SCROLL)
                   ========================================================= */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 sm:gap-3 overflow-hidden overflow-x-hidden">
                    {/* =====================================================
                        KOLOM KIRI: MENU CATALOG STATION (7/8 COLS)
                       ===================================================== */}
                    <div className="col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden overflow-x-hidden p-3 shadow-xs dark:shadow-sm">
                        {/* Pinned Search & Category Filters (Fixed on Top) */}
                        <div className="shrink-0 space-y-2.5 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                            {/* Search Input Bar (42px) */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama menu atau scan barcode..."
                                    className="w-full h-10 bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-xs dark:shadow-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="w-7 h-7 absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors"
                                        aria-label="Hapus pencarian"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Horizontal Strip */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none scrollbar-none">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        selectedCategory === 'all'
                                            ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-[#08090D] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] dark:border-white/[0.08]'
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Semua ({products.length})</span>
                                </button>
                                {categories.map((c) => {
                                    const count = products.filter(
                                        (p) => p.category_id === c.id
                                    ).length;
                                    const isSelected = selectedCategory === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(c.id)}
                                            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-[#08090D] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] dark:border-white/[0.08]'
                                            }`}
                                        >
                                            <span>{c.category_name}</span>
                                            <span
                                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dedicated Scrollable Product Grid (The only part that scrolls on the left!) */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1.5 pt-2.5">
                            {filteredProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
                                        Menu Tidak Ditemukan
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-xs">
                                        Periksa kembali kata kunci pencarian atau pilih kategori lain di atas.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
                                    {filteredProducts.map((p) => {
                                        const isOutOfStock = p.stock_qty <= 0 || !p.is_available;
                                        const isLowStock = p.stock_qty > 0 && p.stock_qty <= 5;
                                        const inCartQty = cartQtyMap[p.id] || 0;

                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                disabled={isOutOfStock}
                                                onClick={() => addToCart(p)}
                                                className={`p-3 rounded-xl text-left border flex flex-col justify-between min-h-[135px] relative overflow-hidden select-none transition-all group ${
                                                    isOutOfStock
                                                        ? 'bg-slate-100 dark:bg-[#0C0E16]/40 border-slate-200 dark:border-white/[0.04] opacity-50 cursor-not-allowed'
                                                        : inCartQty > 0
                                                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/50 dark:bg-indigo-950/30 dark:border-indigo-500 dark:ring-1 dark:ring-indigo-500/60 active:scale-[0.97]'
                                                        : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-indigo-400 dark:bg-[#08090D] dark:hover:bg-[#121524] dark:border-white/[0.08] dark:hover:border-indigo-500/50 active:scale-[0.97] cursor-pointer shadow-xs dark:shadow-none'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1.5 gap-1.5 min-w-0">
                                                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] tracking-wider truncate min-w-0 flex-1">
                                                            {p.barcode || 'NO-BARCODE'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {p.requires_kitchen ? (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                                                                    <UtensilsCrossed className="w-2.5 h-2.5" />
                                                                    <span>Dapur</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1">
                                                                    <Coffee className="w-2.5 h-2.5" />
                                                                    <span>Instan</span>
                                                                </span>
                                                            )}
                                                            {inCartQty > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-indigo-600 text-white border border-indigo-400 shadow-sm">
                                                                    ×{inCartQty}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                                        {p.product_name}
                                                    </h4>
                                                </div>

                                                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between mt-2">
                                                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                                                        {formatRupiah(p.selling_price)}
                                                    </span>
                                                    {isOutOfStock ? (
                                                        <span className="text-[10px] font-mono font-bold text-rose-500 dark:text-rose-400">
                                                            Habis
                                                        </span>
                                                    ) : isLowStock ? (
                                                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-300 tabular-nums">
                                                            Sisa {p.stock_qty}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                                                            {p.stock_qty} unit
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =====================================================
                        KOLOM KANAN: DIGITAL ORDER REGISTER / CART (4/5 COLS)
                       ===================================================== */}
                    <div className="col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs dark:shadow-sm">
                        {/* Pinned Header & Service Mode Selector */}
                        <div className="shrink-0 p-3 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E101A] space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                                        Struk Transaksi
                                    </h3>
                                    {cart.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                            {cartTotals.totalItems} unit
                                        </span>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsClearCartModalOpen(true)}
                                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Kosongkan</span>
                                    </button>
                                )}
                            </div>

                            {/* Service Type Switcher (40px) */}
                            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setOrderSource('cashier_direct')}
                                    className={`min-h-[38px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        orderSource === 'cashier_direct'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Bungkus</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderSource('qr_table')}
                                    className={`min-h-[38px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        orderSource === 'qr_table'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    <Store className="w-3.5 h-3.5" />
                                    <span>Makan Meja</span>
                                </button>
                            </div>

                            {/* Dine-in Table & Customer Input */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {orderSource === 'qr_table' && (
                                    <select
                                        value={selectedTableId}
                                        onChange={(e) => setSelectedTableId(e.target.value)}
                                        className="w-full h-9 bg-white dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
                                    >
                                        <option value="">Pilih Nomor Meja...</option>
                                        {dining_tables.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                Meja {t.table_number} ({t.capacity} org)
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <div
                                    className={`relative ${
                                        orderSource === 'qr_table' ? 'sm:col-span-1' : 'col-span-full'
                                    }`}
                                >
                                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Nama Tamu (Walk-in)"
                                        className="w-full h-9 bg-white dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] rounded-lg pl-8 pr-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dedicated Scrollable Items Stream (The only part that scrolls on the right!) */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Belum Ada Menu Dipilih
                                    </p>
                                    <p className="text-[11px] text-slate-500 max-w-[180px]">
                                        Sentuh menu di katalog sebelah kiri atau scan barcode produk.
                                    </p>
                                </div>
                            ) : (
                                cart.map((item) => {
                                    const itemSubtotal = item.selling_price * item.quantity;
                                    const isNotesOpen = expandedNotesId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.06] space-y-2 shadow-xs"
                                        >
                                            {/* Line 1: Item Name & Remove */}
                                            <div className="flex items-start justify-between gap-1.5">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {item.product_name}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                                                            {formatRupiah(item.selling_price)}
                                                        </span>
                                                        {item.requires_kitchen && (
                                                            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-500/20">
                                                                Dapur
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                                                    title="Hapus menu"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Line 2: Touch Stepper & Subtotal */}
                                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-white/[0.04]">
                                                {/* Tactile Stepper (36px min touch target) */}
                                                <div className="flex items-center gap-1 bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] rounded-lg p-0.5 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQty(item.id, -1)}
                                                        className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] active:scale-95 text-slate-700 dark:text-white flex items-center justify-center transition-all"
                                                        aria-label="Kurangi"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQty(item.id, 1)}
                                                        className="w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm"
                                                        aria-label="Tambah"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {formatRupiah(itemSubtotal)}
                                                </span>
                                            </div>

                                            {/* Line 3: Item Note Toggle */}
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedNotesId(
                                                            isNotesOpen ? null : item.id
                                                        )
                                                    }
                                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    <span>
                                                        {item.notes
                                                            ? `Catatan: ${item.notes}`
                                                            : '+ Catatan Masak'}
                                                    </span>
                                                </button>
                                                {isNotesOpen && (
                                                    <input
                                                        type="text"
                                                        value={item.notes || ''}
                                                        onChange={(e) =>
                                                            updateCartNotes(item.id, e.target.value)
                                                        }
                                                        placeholder="Misal: Es sedikit, tidak pedas"
                                                        className="w-full h-7 bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] rounded px-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 mt-1 shadow-xs"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* =====================================================
                            PERMANENTLY PINNED PAY DOCK (NEVER SCROLLS AWAY!)
                           ===================================================== */}
                        <div className="shrink-0 p-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#08090D] space-y-2.5">
                            {/* Grand Total Display (Massive 28px Monospace) */}
                            <div className="p-3 rounded-xl bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
                                <div>
                                    <span className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider block">
                                        Total Tagihan:
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                        {cartTotals.totalItems} item dipilih
                                    </span>
                                </div>
                                <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                                    {formatRupiah(cartTotals.totalAmount)}
                                </span>
                            </div>

                            {/* Direct Fast-Pay Buttons (46px Touch Targets) */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={cart.length === 0}
                                    onClick={() => handleOpenPayment('tunai')}
                                    className={`min-h-[46px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                        cart.length === 0
                                            ? 'bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-950 dark:bg-[#1E1B4B] dark:hover:bg-[#312E81] dark:border-indigo-500/50 dark:text-indigo-100 active:scale-[0.98] shadow-xs'
                                    }`}
                                >
                                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Bayar Tunai</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={cart.length === 0}
                                    onClick={() => handleOpenPayment('qris')}
                                    className={`min-h-[46px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                        cart.length === 0
                                            ? 'bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-950 dark:bg-[#1E1B4B] dark:hover:bg-[#312E81] dark:border-indigo-500/50 dark:text-indigo-100 active:scale-[0.98] shadow-xs'
                                    }`}
                                >
                                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                                    <span>Bayar QRIS</span>
                                </button>
                            </div>

                            {/* Big Primary CTA Button (50px Height) */}
                            <SpecularButton
                                variant="primary"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={() => handleOpenPayment('tunai')}
                                className="w-full min-h-[48px] text-xs sm:text-sm font-bold tracking-wide"
                                icon={ArrowRight}
                                iconPosition="right"
                            >
                                Proses Pesanan (F8)
                            </SpecularButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================
                MODAL 1: KITCHEN FULFILLMENT HANDSHAKE MODAL
               ========================================================= */}
            <AcrylicModal
                isOpen={isFulfillmentModalOpen}
                onClose={() => setIsFulfillmentModalOpen(false)}
                title="Pesanan Selesai Dimasak Dapur"
                subtitle={`${fulfillment_orders.length} pesanan siap diserahkan ke pelanggan`}
                maxWidth="max-w-lg"
                footer={
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        onClick={() => setIsFulfillmentModalOpen(false)}
                        className="min-h-[44px] px-5"
                    >
                        Tutup
                    </SpecularButton>
                }
            >
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {fulfillment_orders.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                            Tidak ada antrean pesanan siap antar saat ini.
                        </div>
                    ) : (
                        fulfillment_orders.map((ord) => (
                            <div
                                key={ord.id}
                                className="p-3.5 rounded-xl bg-[#08090D] border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-bold font-mono text-emerald-400">
                                            #{ord.token_number}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                                            Siap Antar
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-200 block">
                                        {ord.table ? `Meja ${ord.table.table_number}` : 'Bungkus / Takeaway'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block truncate">
                                        {ord.customer_name || 'Pelanggan Walk-in'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleServeOrder(ord.id);
                                        if (fulfillment_orders.length <= 1) {
                                            setIsFulfillmentModalOpen(false);
                                        }
                                    }}
                                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm shrink-0"
                                >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    <span>Serahkan</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </AcrylicModal>

            {/* =========================================================
                MODAL 2: KONFIRMASI PEMBAYARAN KASIR
               ========================================================= */}
            <AcrylicModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Kasir: Konfirmasi Pembayaran"
                subtitle={`Total: ${formatRupiah(cartTotals.totalAmount)} (${cartTotals.totalItems} unit)`}
                maxWidth="max-w-xl"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="min-h-[46px] px-5"
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
                            className="min-h-[46px] px-6 font-bold"
                        >
                            Selesaikan & Cetak Struk
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCheckout} className="space-y-4">
                    {/* Ringkasan Singkat Pelanggan & Meja */}
                    <div className="p-3 rounded-xl bg-[#08090D] border border-white/[0.08] flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <div>
                            <span className="text-slate-400 block font-medium">Pelanggan:</span>
                            <span className="text-white font-bold text-sm sm:text-base">
                                {customerName || 'Pelanggan Walk-in'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block font-medium">Layanan:</span>
                            <span className="text-indigo-300 font-bold text-sm sm:text-base">
                                {orderSource === 'qr_table'
                                    ? `Makan di Meja ${
                                          dining_tables.find((t) => String(t.id) === String(selectedTableId))
                                              ?.table_number || '-'
                                      }`
                                    : 'Bungkus / Takeaway'}
                            </span>
                        </div>
                    </div>

                    {/* Selector Metode Pembayaran (50px Touch Targets) */}
                    <div>
                        <label className="text-xs sm:text-sm font-semibold text-slate-200 block mb-2">
                            Pilih Metode Pembayaran:
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutData('payment_method', 'tunai');
                                    setCheckoutData('amount_received', cartTotals.totalAmount);
                                }}
                                className={`min-h-[50px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
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
                                className={`min-h-[50px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
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
                        <div className="p-5 rounded-xl bg-[#08090D] border border-white/[0.08] text-center space-y-3">
                            <div className="w-32 h-32 mx-auto rounded-xl bg-white p-2.5 flex items-center justify-center shadow-lg">
                                <QrCode className="w-28 h-28 text-slate-900" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-indigo-300 block">
                                    Tunjukkan QRIS ke Tamu
                                </span>
                                <span className="text-xs text-slate-400 block mt-0.5">
                                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri & m-Banking.
                                </span>
                            </div>
                            <div className="pt-2 border-t border-white/[0.06] text-xs sm:text-sm font-mono text-slate-200">
                                Nominal Pas:{' '}
                                <span className="text-white font-extrabold text-base">
                                    {formatRupiah(cartTotals.totalAmount)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Kalkulator Uang Tunai & Pecahan Cepat */}
                    {checkoutData.payment_method === 'tunai' && (
                        <div className="space-y-3.5">
                            <AcrylicInput
                                label="Uang Fisik Diterima dari Pelanggan (Rp)"
                                type="number"
                                min={cartTotals.totalAmount}
                                value={checkoutData.amount_received}
                                onChange={(e) =>
                                    setCheckoutData('amount_received', parseFloat(e.target.value) || 0)
                                }
                                error={checkoutErrors.amount_received}
                                inputClassName="text-lg sm:text-xl font-mono font-bold"
                                required
                            />

                            {/* Tombol Pecahan Uang Cepat (Min 42px Touch Targets) */}
                            <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5 font-bold">
                                    Pecahan Uang Cepat:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCash(cartTotals.totalAmount)}
                                        className={`min-h-[42px] px-2.5 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                                            Number(checkoutData.amount_received) === cartTotals.totalAmount
                                                ? 'bg-indigo-600 text-white border-indigo-500'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-[#08090D] dark:hover:bg-white/[0.08] dark:text-slate-200 dark:border-white/[0.08]'
                                        }`}
                                    >
                                        Uang Pas
                                    </button>
                                    {[20000, 50000, 100000, 200000].map((nominal) => {
                                        const isSelected =
                                            Number(checkoutData.amount_received) === nominal;
                                        return (
                                            <button
                                                key={nominal}
                                                type="button"
                                                onClick={() => handleQuickCash(nominal)}
                                                className={`min-h-[42px] px-2.5 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-[#08090D] dark:hover:bg-white/[0.08] dark:text-slate-200 dark:border-white/[0.08]'
                                                }`}
                                            >
                                                {formatRupiah(nominal)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Kotak Peringatan Uang Kurang */}
                            {isUnderpaid && (
                                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                                    <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold block">Uang Diterima Masih Kurang!</span>
                                        <span className="text-xs text-rose-700 dark:text-rose-300/90 block mt-0.5">
                                            Kurang {formatRupiah(shortfallAmount)} dari total tagihan ({formatRupiah(cartTotals.totalAmount)}).
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Kotak Kembalian Besar (30px Monospace Emerald Display) */}
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 block">
                                        Kembalian:
                                    </span>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
                                        Wajib diserahkan ke tamu
                                    </span>
                                </div>
                                <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatRupiah(changeAmount)}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL 3: BUKA SHIFT BARU
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
                            className="min-h-[44px] px-5"
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={openShiftProcessing}
                            onClick={handleSubmitOpenShift}
                            className="min-h-[44px] px-6 font-bold"
                        >
                            Buka Sesi Shift
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitOpenShift} className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-[#08090D] border border-white/[0.08] text-xs text-slate-300 space-y-1">
                        <span className="font-bold text-white block">Petunjuk Kasir:</span>
                        <p className="text-slate-400 leading-relaxed">
                            Modal awal kasir digunakan sebagai uang kembalian untuk transaksi awal dan dasar rekonsiliasi saat tutup shift.
                        </p>
                    </div>

                    <div className="space-y-1.5">
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
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
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

                    <div className="space-y-1.5">
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
                            <span className="text-xs text-slate-400 mr-1">Pecahan:</span>
                            {[100000, 200000, 300000, 500000].map((nominal) => (
                                <button
                                    key={nominal}
                                    type="button"
                                    onClick={() => setOpenShiftData('opening_cash', nominal)}
                                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border transition-colors ${
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
                        placeholder="Misal: Uang kembalian pecahan lengkap"
                    />
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL 4: TUTUP SHIFT KASIR & REKONSILIASI KAS
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
                            className="min-h-[44px] px-5"
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            loading={closeShiftProcessing}
                            onClick={handleSubmitCloseShift}
                            className="min-h-[44px] px-6 font-bold"
                        >
                            Tutup & Kunci Shift
                        </SpecularButton>
                    </>
                }
            >
                {active_shift && (
                    <form onSubmit={handleSubmitCloseShift} className="space-y-3.5">
                        <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.08] text-xs font-mono space-y-1.5">
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
                            <div className="flex justify-between text-slate-200 font-bold pt-1.5 border-t border-white/[0.08]">
                                <span>Target Fisik Tunai di Laci:</span>
                                <span className="text-emerald-400 font-bold text-sm">
                                    {formatRupiah(expectedShiftCash)}
                                </span>
                            </div>
                        </div>

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
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span>Kas Sesuai! Jumlah fisik sama persis dengan sistem (Selisih: Rp 0).</span>
                                </div>
                            ) : shiftDiff < 0 ? (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                                    <span>
                                        Selisih Kurang:{' '}
                                        <strong className="font-mono font-bold text-rose-200">
                                            {formatRupiah(Math.abs(shiftDiff))}
                                        </strong>
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>
                                        Selisih Lebih:{' '}
                                        <strong className="font-mono font-bold text-amber-200">
                                            +{formatRupiah(shiftDiff)}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        <AcrylicInput
                            label="Keterangan / Alasan Selisih Kas (Jika Ada)"
                            value={closeShiftData.notes}
                            onChange={(e) => setCloseShiftData('notes', e.target.value)}
                            placeholder="Misal: Uang kembalian receh kurang"
                        />
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================
                MODAL 5: KONFIRMASI KOSONGKAN KERANJANG
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
                            className="min-h-[42px] px-4"
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            onClick={handleConfirmClearCart}
                            className="min-h-[42px] px-5 font-bold"
                        >
                            Ya, Kosongkan
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 space-y-2">
                    <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Hapus Seluruh Item Pesanan</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Seluruh <strong className="text-white font-mono">{cartTotals.totalItems} item</strong> senilai{' '}
                        <strong className="text-white font-mono">{formatRupiah(cartTotals.totalAmount)}</strong> akan dihapus dari transaksi saat ini.
                    </p>
                </div>
            </AcrylicModal>

            {/* =========================================================
                MODAL 6: RIWAYAT TRANSAKSI KASIR & TRACKING PROSES
               ========================================================= */}
            <AcrylicModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Riwayat Transaksi Kasir Hari Ini"
                subtitle="Pantau status transaksi: proses dapur, siap saji, dan pesanan yang belum selesai."
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-slate-400 font-mono">
                            Total: <strong className="text-white font-bold">{recent_transactions.length}</strong> transaksi hari ini
                        </div>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsHistoryModalOpen(false)}
                            className="min-h-[42px] px-5"
                        >
                            Tutup
                        </SpecularButton>
                    </div>
                }
            >
                <div className="space-y-3.5">
                    {/* Controls: Search Bar & Refresh */}
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                placeholder="Cari nomor token (#042), meja, nama pelanggan, atau invoice..."
                                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#08090D] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                            />
                            {historySearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setHistorySearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.reload({
                                    only: ['recent_transactions', 'fulfillment_orders'],
                                    preserveScroll: true,
                                })
                            }
                            className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                            title="Segarkan data transaksi"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Segarkan</span>
                        </button>
                    </div>

                    {/* Filter Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
                        {[
                            { id: 'all', label: 'Semua', count: recent_transactions.length },
                            {
                                id: 'unprocessed',
                                label: 'Belum Selesai',
                                count: unprocessedTransactions.length,
                                highlight: true,
                            },
                            { id: 'processing', label: 'Sedang Dimasak', count: processingTransactions.length },
                            { id: 'ready', label: 'Siap Diserahkan', count: readyTransactions.length },
                            { id: 'served', label: 'Selesai', count: servedTransactions.length },
                        ].map((tab) => {
                            const isActive = historyFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setHistoryFilter(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-white/[0.1] text-white border border-white/[0.16] shadow-sm'
                                            : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                            tab.highlight && tab.count > 0
                                                ? 'bg-amber-500/20 text-amber-300 font-bold'
                                                : 'bg-white/[0.06] text-slate-400'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Transaction Cards List */}
                    <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                        {filteredTransactions.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 space-y-2">
                                <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                                <p className="text-xs">Tidak ada data transaksi yang sesuai filter.</p>
                            </div>
                        ) : (
                            filteredTransactions.map((tx) => {
                                const isReady = tx.order_status === 'ready';
                                const isProcessing = tx.order_status === 'processing';
                                const isServed = tx.order_status === 'served';

                                return (
                                    <div
                                        key={tx.id}
                                        className={`p-3.5 rounded-xl border transition-all ${
                                            isReady
                                                ? 'bg-[#09121E] border-emerald-500/40 shadow-sm'
                                                : isProcessing
                                                ? 'bg-[#0E0F17] border-amber-500/30'
                                                : 'bg-[#08090D] border-white/[0.06]'
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-3 flex-wrap border-b border-white/[0.06] pb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-base font-bold font-mono text-white">
                                                    #{tx.token_number}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400">
                                                    {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    WIB
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-xs font-semibold text-indigo-300">
                                                    {tx.table ? `Meja ${tx.table.table_number}` : 'Bungkus / Takeaway'}
                                                </span>
                                                {tx.customer_name && tx.customer_name !== 'Pelanggan Walk-in' && (
                                                    <span className="text-xs text-slate-400">
                                                        ({tx.customer_name})
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div>
                                                {isProcessing && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                                        <span>Sedang Dimasak Dapur</span>
                                                    </span>
                                                )}
                                                {isReady && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 animate-pulse">
                                                        <Bell className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Siap Diserahkan</span>
                                                    </span>
                                                )}
                                                {isServed && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Pesanan Selesai</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Items */}
                                        <div className="py-2 space-y-1 text-xs">
                                            {(tx.items || []).map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-slate-300 font-mono">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{item.quantity}x</span>
                                                        <span className="text-slate-200">{item.product?.product_name || 'Menu'}</span>
                                                        {item.notes && (
                                                            <span className="text-[11px] text-amber-400/90 italic">
                                                                ("{item.notes}")
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-slate-400">{formatRupiah(item.subtotal)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Card Footer */}
                                        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs flex-wrap gap-2">
                                            <div className="flex items-center gap-3 font-mono">
                                                <span className="text-slate-400">Total:</span>
                                                <span className="text-sm font-bold text-white">
                                                    {formatRupiah(tx.total_amount)}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/[0.04] border border-white/[0.08] text-slate-300">
                                                    {tx.payment_method}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Button Cetak Struk */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrderForReprint(tx);
                                                        setIsReprintModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>Struk</span>
                                                </button>

                                                {/* If Ready: Button Serahkan */}
                                                {isReady && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleServeOrder(tx.id)}
                                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        <span>Konfirmasi Serahkan</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </AcrylicModal>

            {/* =========================================================
                MODAL 7: PREVIEW & CETAK ULANG STRUK TRANSAKSI
               ========================================================= */}
            <AcrylicModal
                isOpen={isReprintModalOpen}
                onClose={() => setIsReprintModalOpen(false)}
                title="Struk Bukti Pembayaran"
                subtitle={selectedOrderForReprint ? `Invoice: ${selectedOrderForReprint.invoice_number}` : ''}
                maxWidth="max-w-sm"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsReprintModalOpen(false)}
                            className="min-h-[42px] px-4"
                        >
                            Tutup
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={Printer}
                            onClick={() => window.print()}
                            className="min-h-[42px] px-5 font-bold"
                        >
                            Cetak Struk
                        </SpecularButton>
                    </div>
                }
            >
                {selectedOrderForReprint && (
                    <div className="p-4 rounded-xl bg-white text-slate-900 font-mono text-xs space-y-3 shadow-inner">
                        <div className="text-center border-b border-dashed border-slate-300 pb-3">
                            <h4 className="font-bold text-sm tracking-wider uppercase">KASIR APP CANTEEN</h4>
                            <p className="text-[11px] text-slate-600">Sistem Kasir & Dapur Terintegrasi</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {selectedOrderForReprint.invoice_number}
                            </p>
                        </div>

                        <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Nomor Token:</span>
                                <span className="font-bold text-sm">#{selectedOrderForReprint.token_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Tanggal/Jam:</span>
                                <span>{new Date(selectedOrderForReprint.created_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Layanan:</span>
                                <span>{selectedOrderForReprint.table ? `Meja ${selectedOrderForReprint.table.table_number}` : 'Takeaway / Bungkus'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Pelanggan:</span>
                                <span>{selectedOrderForReprint.customer_name || 'Pelanggan'}</span>
                            </div>
                        </div>

                        <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                            {(selectedOrderForReprint.items || []).map((item) => (
                                <div key={item.id} className="flex justify-between">
                                    <span>
                                        {item.quantity}x {item.product?.product_name || 'Item'}
                                    </span>
                                    <span>{formatRupiah(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between font-bold text-xs pt-1">
                                <span>Total Belanja:</span>
                                <span>{formatRupiah(selectedOrderForReprint.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Metode Bayar:</span>
                                <span className="uppercase">{selectedOrderForReprint.payment_method}</span>
                            </div>
                            {selectedOrderForReprint.payment_method === 'tunai' && (
                                <>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tunai Diterima:</span>
                                        <span>{formatRupiah(selectedOrderForReprint.amount_received)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Kembalian:</span>
                                        <span>{formatRupiah(selectedOrderForReprint.change_amount)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="text-center border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500">
                            <p>Terima Kasih Atas Kunjungan Anda!</p>
                            <p>Pesanan Segar dari Dapur Kantin</p>
                        </div>
                    </div>
                )}
            </AcrylicModal>
        </AuthenticatedLayout>
    );
}
