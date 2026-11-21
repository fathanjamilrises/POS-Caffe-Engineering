import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    ScanBarcode,
    UtensilsCrossed,
    Banknote,
    QrCode,
    Printer,
    RefreshCw,
    Store,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    Clock,
    Coffee,
    ShoppingBag,
    X,
    FileText,
    Check,
    Sparkles,
    Keyboard,
    HelpCircle,
    ChefHat,
    DollarSign,
    Layers,
    User,
    Volume2,
} from 'lucide-react';
import ThemeToggle from '@/Components/Theme/ThemeToggle';
import { useTheme } from '@/Hooks/useTheme';
import { useBarcodeScanner } from '@/Hooks/useBarcodeScanner';
import {
    playCartBeep,
    playScannerBeep,
    playSuccessChime,
    playWarningBuzzer,
    playKitchenAlertBell,
} from '@/Services/audio';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

const DEFAULT_DEMO_PRODUCTS = [
    {
        id: 1,
        product_name: 'Nasi Goreng Spesial',
        barcode: '8991001',
        selling_price: 20000,
        stock_qty: 48,
        requires_kitchen: true,
        category: { id: 1, category_name: 'Makanan' },
        is_available: true,
    },
    {
        id: 2,
        product_name: 'Mie Goreng Seafood',
        barcode: '8991002',
        selling_price: 23000,
        stock_qty: 40,
        requires_kitchen: true,
        category: { id: 1, category_name: 'Makanan' },
        is_available: true,
    },
    {
        id: 3,
        product_name: 'Ayam Geprek Sambal Korek',
        barcode: '8991003',
        selling_price: 22000,
        stock_qty: 25,
        requires_kitchen: true,
        category: { id: 1, category_name: 'Makanan' },
        is_available: true,
    },
    {
        id: 4,
        product_name: 'Es Teh Manis',
        barcode: '8992001',
        selling_price: 5000,
        stock_qty: 95,
        requires_kitchen: false,
        category: { id: 2, category_name: 'Minuman' },
        is_available: true,
    },
    {
        id: 5,
        product_name: 'Kopi Susu Gula Aren',
        barcode: '8992002',
        selling_price: 15000,
        stock_qty: 50,
        requires_kitchen: false,
        category: { id: 2, category_name: 'Minuman' },
        is_available: true,
    },
    {
        id: 6,
        product_name: 'Lemon Tea Segar Dingin',
        barcode: '8992003',
        selling_price: 8000,
        stock_qty: 60,
        requires_kitchen: false,
        category: { id: 2, category_name: 'Minuman' },
        is_available: true,
    },
    {
        id: 7,
        product_name: 'Kentang Goreng (French Fries)',
        barcode: '8993001',
        selling_price: 14000,
        stock_qty: 30,
        requires_kitchen: true,
        category: { id: 3, category_name: 'Snack & Dessert' },
        is_available: true,
    },
    {
        id: 8,
        product_name: 'Roti Bakar Coklat Keju',
        barcode: '8993002',
        selling_price: 16000,
        stock_qty: 20,
        requires_kitchen: true,
        category: { id: 3, category_name: 'Snack & Dessert' },
        is_available: true,
    },
];

export default function DemoPos({
    products = [],
    categories = [],
    dining_tables = [],
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Combine database products with fallback demo products if database has few
    const menuList = useMemo(() => {
        if (products && products.length > 0) {
            return products;
        }
        return DEFAULT_DEMO_PRODUCTS;
    }, [products]);

    // Active Category Filter
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Cart State
    const [cart, setCart] = useState([
        {
            product: menuList[0] || DEFAULT_DEMO_PRODUCTS[0],
            quantity: 2,
        },
        {
            product: menuList[3] || DEFAULT_DEMO_PRODUCTS[3],
            quantity: 2,
        },
    ]);

    // Service Mode: 'dine_in' or 'takeaway'
    const [serviceMode, setServiceMode] = useState('dine_in');
    // Table Selection: 'free' (Bebas Duduk) or table_number string
    const [selectedTable, setSelectedTable] = useState('free');
    const [customerName, setCustomerName] = useState('Pelanggan Walk-In');

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('tunai'); // 'tunai' | 'qris'
    const [amountReceived, setAmountReceived] = useState('');
    const [qrisPaid, setQrisPaid] = useState(false);

    // Thermal Receipt Modal & Token Tracking
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
    const [receiptPaperWidth, setReceiptPaperWidth] = useState('58mm');
    const [tokenCounter, setTokenCounter] = useState(42);

    // Keyboard Shortcuts Modal
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Barcode input focus
    const barcodeInputRef = useRef(null);
    const [barcodeManualInput, setBarcodeManualInput] = useState('');

    // Categories list with dynamic counts
    const categoryOptions = useMemo(() => {
        const counts = {};
        menuList.forEach((p) => {
            const catName = p.category?.category_name || 'Lainnya';
            counts[catName] = (counts[catName] || 0) + 1;
        });

        const uniqueCategories = [
            { id: 'all', name: 'Semua Menu', count: menuList.length },
        ];

        const seen = new Set();
        menuList.forEach((p) => {
            const catId = p.category?.id;
            const catName = p.category?.category_name;
            if (catId && catName && !seen.has(catId)) {
                seen.add(catId);
                uniqueCategories.push({
                    id: catId,
                    name: catName,
                    count: counts[catName] || 0,
                });
            }
        });

        return uniqueCategories;
    }, [menuList]);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return menuList.filter((product) => {
            const matchesCategory =
                selectedCategoryId === 'all' ||
                product.category_id === Number(selectedCategoryId) ||
                product.category?.id === Number(selectedCategoryId);

            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                product.product_name.toLowerCase().includes(q) ||
                (product.barcode && product.barcode.toLowerCase().includes(q));

            return matchesCategory && matchesQuery;
        });
    }, [menuList, selectedCategoryId, searchQuery]);

    // Calculations
    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const grandTotal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const price = Number(item.product.selling_price) || 0;
            return sum + price * item.quantity;
        }, 0);
    }, [cart]);

    const numAmountReceived = Number(amountReceived) || 0;
    const changeAmount = Math.max(0, numAmountReceived - grandTotal);
    const isUnderpaid = paymentMethod === 'tunai' && numAmountReceived < grandTotal;

    // Cart Mutations
    const addToCart = useCallback((product) => {
        if (!product.is_available || product.stock_qty <= 0) {
            playWarningBuzzer();
            return;
        }

        playCartBeep();
        setCart((prev) => {
            const index = prev.findIndex((item) => item.product.id === product.id);
            if (index > -1) {
                const next = [...prev];
                next[index] = {
                    ...next[index],
                    quantity: next[index].quantity + 1,
                };
                return next;
            }
            return [...prev, { product, quantity: 1 }];
        });
    }, []);

    const updateQuantity = useCallback((productId, delta) => {
        playCartBeep();
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.product.id === productId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean);
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        playCartBeep();
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        playCartBeep();
        setCart([]);
        setAmountReceived('');
        setQrisPaid(false);
    }, []);

    // Quick populate dummy order
    const populateSampleOrder = useCallback(() => {
        playCartBeep();
        const item1 = menuList[0] || DEFAULT_DEMO_PRODUCTS[0];
        const item2 = menuList[3] || DEFAULT_DEMO_PRODUCTS[3];
        const item3 = menuList[6] || DEFAULT_DEMO_PRODUCTS[6];

        setCart([
            { product: item1, quantity: 2 },
            { product: item2, quantity: 2 },
            { product: item3, quantity: 1 },
        ]);
        setCustomerName('Budi Santoso');
        setServiceMode('dine_in');
        setSelectedTable('3');
        setAmountReceived('');
        setQrisPaid(false);
    }, [menuList]);

    // Barcode Scanning Integration
    const handleBarcodeDetected = useCallback(
        (scannedCode) => {
            const clean = scannedCode.trim();
            if (!clean) return;

            const matchedProduct = menuList.find(
                (p) => String(p.barcode) === clean || p.product_name.toLowerCase().includes(clean.toLowerCase())
            );

            if (matchedProduct) {
                playScannerBeep();
                addToCart(matchedProduct);
            } else {
                playWarningBuzzer();
            }
        },
        [menuList, addToCart]
    );

    // Global Hardware Barcode Listener
    useBarcodeScanner(handleBarcodeDetected);

    // Manual Barcode Submit
    const handleManualBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!barcodeManualInput.trim()) return;
        handleBarcodeDetected(barcodeManualInput);
        setBarcodeManualInput('');
    };

    // Quick Cash Helpers
    const setExactCash = () => {
        playCartBeep();
        setAmountReceived(String(grandTotal));
    };

    const setPresetCash = (val) => {
        playCartBeep();
        setAmountReceived(String(val));
    };

    // Process Demo Payment
    const handleProcessPayment = () => {
        if (cart.length === 0) {
            playWarningBuzzer();
            return;
        }

        if (paymentMethod === 'tunai' && isUnderpaid) {
            playWarningBuzzer();
            return;
        }

        const nextToken = tokenCounter + 1;
        setTokenCounter(nextToken);

        const orderSnapshot = {
            token_number: nextToken,
            created_at: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            date_str: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
            customer_name: customerName || 'Pelanggan Walk-In',
            service_mode: serviceMode,
            table_info:
                serviceMode === 'takeaway'
                    ? 'Bungkus (Bawa Pulang)'
                    : selectedTable === 'free'
                    ? 'Makan di Tempat - Bebas Duduk'
                    : `Makan di Tempat - Meja ${selectedTable}`,
            items: cart.map((i) => ({
                id: i.product.id,
                name: i.product.product_name,
                price: Number(i.product.selling_price),
                quantity: i.quantity,
                subtotal: Number(i.product.selling_price) * i.quantity,
                requires_kitchen: Boolean(i.product.requires_kitchen),
            })),
            total_amount: grandTotal,
            payment_method: paymentMethod.toUpperCase(),
            amount_received: paymentMethod === 'tunai' ? numAmountReceived : grandTotal,
            change_amount: paymentMethod === 'tunai' ? changeAmount : 0,
        };

        setLastCompletedOrder(orderSnapshot);
        playSuccessChime();

        // If order contains kitchen items, play resonant bell after chime
        const hasKitchenItems = orderSnapshot.items.some((i) => i.requires_kitchen);
        if (hasKitchenItems) {
            setTimeout(() => {
                playKitchenAlertBell();
            }, 600);
        }

        setShowReceiptModal(true);
    };

    // Keyboard Shortcuts (F1 - F10, Enter)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Do not trigger if typing in text inputs
            const target = e.target;
            const isInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            if (e.key === 'F1') {
                e.preventDefault();
                setShowHelpModal((prev) => !prev);
            } else if (e.key === 'F2') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                populateSampleOrder();
            } else if (e.key === 'F9') {
                e.preventDefault();
                clearCart();
            } else if (e.key === 'F10') {
                e.preventDefault();
                if (cart.length > 0 && !isUnderpaid) {
                    handleProcessPayment();
                }
            } else if (e.key === 'Escape') {
                if (showReceiptModal) setShowReceiptModal(false);
                if (showHelpModal) setShowHelpModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, isUnderpaid, showReceiptModal, showHelpModal, populateSampleOrder, clearCart]);

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070913] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200 antialiased overflow-x-hidden transition-colors duration-300">
            <Head title="Demo POS Kasir - Sistem Kasir & Struk Digital Interaktif" />

            {/* Architectural Grid Lines Background */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20 transition-opacity duration-300"
                style={{
                    backgroundImage: isDark
                        ? 'linear-gradient(to right, rgba(99, 102, 241, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.22) 1px, transparent 1px)'
                        : 'linear-gradient(to right, rgba(67, 56, 202, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(67, 56, 202, 0.12) 1px, transparent 1px)',
                    backgroundSize: '44px 44px',
                }}
                aria-hidden="true"
            />

            {/* Focused Ambient Blue Glow on the Right */}
            <div
                className="pointer-events-none fixed top-10 -right-20 w-[550px] h-[550px] rounded-full z-0 opacity-70 dark:opacity-60"
                style={{
                    background: isDark
                        ? 'radial-gradient(circle, rgba(59, 130, 246, 0.40) 0%, rgba(67, 56, 202, 0.28) 38%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(59, 130, 246, 0.14) 38%, transparent 70%)',
                    filter: 'blur(50px)',
                }}
                aria-hidden="true"
            />

            {/* =========================================================================
                TOP BAR: DEMO SIMULATION NOTIFICATION & CONTROL CENTER
                ========================================================================= */}
            <header className="relative z-20 w-full bg-white/85 dark:bg-[#0B0D13]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    {/* Brand & Demo Pill */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center text-white shadow-xs border border-indigo-400/30 hover:scale-105 transition-transform"
                            title="Kembali ke Beranda"
                        >
                            <Store className="w-4 h-4" />
                        </Link>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                                    DEMO POS KASIR
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>SANDBOX 100% OFFLINE</span>
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-mono">
                                Simulasi mandiri tanpa autentikasi, tidak mengubah data produksi kafe.
                            </p>
                        </div>
                    </div>

                    {/* Quick Demo Controls */}
                    <div className="flex items-center gap-2">
                        {/* Populate Sample Order */}
                        <button
                            type="button"
                            onClick={populateSampleOrder}
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25 transition-colors cursor-pointer"
                            title="F4: Isi keranjang dengan contoh pesanan siap bayar"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Isi Contoh Pesanan</span>
                            <span className="text-[10px] font-mono opacity-70">(F4)</span>
                        </button>

                        {/* Reset Cart */}
                        <button
                            type="button"
                            onClick={clearCart}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
                            title="F9: Kosongkan keranjang"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>

                        {/* Hotkeys Modal Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
                            title="F1: Panduan tombol pintasan keyboard"
                        >
                            <Keyboard className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Hotkeys (F1)</span>
                        </button>

                        {/* Theme Switcher */}
                        <ThemeToggle />

                        {/* Return to Landing */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Beranda</span>
                        </Link>

                        {/* Real POS Login */}
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] border border-indigo-500/30 transition-all active:scale-95"
                            title="Masuk ke Akun Kasir Asli Berlisensi"
                        >
                            <span>Masuk Kasir Asli</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                MAIN POS WORKSTATION LAYOUT (SPLIT VIEW)
                ========================================================================= */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* LEFT PANE: PRODUCT CATALOG & BARCODE SCANNER (7 of 12 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Search & Hardware Barcode Simulator Bar */}
                        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0B0D13]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3">
                            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                {/* Search input */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari nama menu atau barcode..."
                                        className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121524] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 font-medium"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Barcode Scanner Input Simulator */}
                                <form
                                    onSubmit={handleManualBarcodeSubmit}
                                    className="flex items-center gap-1.5 w-full sm:w-auto"
                                >
                                    <div className="relative flex-1 sm:w-44">
                                        <ScanBarcode className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                                        <input
                                            ref={barcodeInputRef}
                                            type="text"
                                            value={barcodeManualInput}
                                            onChange={(e) => setBarcodeManualInput(e.target.value)}
                                            placeholder="Tembak Barcode..."
                                            className="w-full pl-8 pr-2.5 py-2 rounded-xl text-xs bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-900 dark:text-indigo-200 placeholder-indigo-400/80 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                                        title="Simulasikan pemindaian barcode fisik"
                                    >
                                        Scan
                                    </button>
                                </form>
                            </div>

                            {/* Category Filter Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                                {categoryOptions.map((cat) => {
                                    const isSelected = selectedCategoryId === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                                                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.06]'
                                            }`}
                                        >
                                            <span>{cat.name}</span>
                                            <span
                                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {cat.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Product Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                            {filteredProducts.map((product) => {
                                const isAvailable = product.is_available && product.stock_qty > 0;
                                const isKitchen = Boolean(product.requires_kitchen);
                                const cartItem = cart.find((i) => i.product.id === product.id);
                                const qtyInCart = cartItem ? cartItem.quantity : 0;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => isAvailable && addToCart(product)}
                                        className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[170px] select-none ${
                                            isAvailable
                                                ? 'bg-white/80 dark:bg-[#0B0D13]/85 backdrop-blur-md border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-400/60 dark:hover:border-indigo-500/50 hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]'
                                                : 'bg-slate-100/60 dark:bg-[#07080D]/60 border-slate-200 dark:border-white/[0.04] opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        {/* In Cart Badge */}
                                        {qtyInCart > 0 && (
                                            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                                                {qtyInCart}
                                            </div>
                                        )}

                                        {/* Card Top: Category & Kitchen Flag */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2 pr-6 flex-wrap">
                                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                                    {product.category?.category_name || 'Katalog'}
                                                </span>
                                                <span
                                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                                        isKitchen
                                                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                    }`}
                                                >
                                                    {isKitchen ? 'Dapur KDS' : 'Instan'}
                                                </span>
                                            </div>

                                            {/* Product Title */}
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                                {product.product_name}
                                            </h4>

                                            {/* Barcode code */}
                                            {product.barcode && (
                                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5">
                                                    #{product.barcode}
                                                </span>
                                            )}
                                        </div>

                                        {/* Card Bottom: Price & Stock Status */}
                                        <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                                            <span className="text-xs sm:text-sm font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                                                {formatRupiah(product.selling_price)}
                                            </span>

                                            <span
                                                className={`text-[10px] font-mono font-bold ${
                                                    isAvailable
                                                        ? 'text-slate-500 dark:text-slate-400'
                                                        : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {isAvailable ? `Stok ${product.stock_qty}` : 'Habis'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT PANE: ACTIVE CART & ORDER PAYMENT DOCK (5 of 12 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#0B0D13]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-md space-y-4">
                            {/* Order Header & Mode Selector */}
                            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                            Keranjang Transaksi
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                        {totalItems} item
                                    </span>
                                </div>

                                {/* Service Mode: Dine-in vs Takeaway */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setServiceMode('dine_in')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            serviceMode === 'dine_in'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <UtensilsCrossed className="w-3.5 h-3.5" />
                                        <span>Makan di Tempat</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setServiceMode('takeaway')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            serviceMode === 'takeaway'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        <span>Bungkus (Bawa Pulang)</span>
                                    </button>
                                </div>

                                {/* Table Selector (Only when Dine-in) */}
                                {serviceMode === 'dine_in' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                                            Penempatan Meja:
                                        </span>
                                        <select
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            className="w-full py-1.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-[#121524] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                                        >
                                            <option value="free">Bebas Duduk (Pick-up di Kasir)</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                <option key={num} value={String(num)}>
                                                    Meja {num} (Kapasitas 4 Org)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Customer Name Input */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                                        Nama Pembeli:
                                    </span>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Nama pembeli walk-in..."
                                        className="w-full py-1.5 px-3 rounded-xl text-xs bg-slate-50 dark:bg-[#121524] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <div className="p-8 text-center rounded-xl bg-slate-50/70 dark:bg-[#08090D] border border-dashed border-slate-200 dark:border-white/[0.08] space-y-2">
                                        <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Keranjang masih kosong. Klik menu di katalog atau tekan tombol{' '}
                                            <strong className="text-indigo-600 dark:text-indigo-400">Isi Contoh Pesanan</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    cart.map((item) => {
                                        const subtotal = Number(item.product.selling_price) * item.quantity;
                                        const isKitchen = Boolean(item.product.requires_kitchen);

                                        return (
                                            <div
                                                key={item.product.id}
                                                className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#121524]/60 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                            {item.product.product_name}
                                                        </h5>
                                                        <span
                                                            className={`text-[9px] font-mono px-1 rounded flex-shrink-0 font-semibold ${
                                                                isKitchen
                                                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                                                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                                            }`}
                                                        >
                                                            {isKitchen ? 'Dapur' : 'Instan'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                                                        {formatRupiah(item.product.selling_price)}
                                                    </span>
                                                </div>

                                                {/* Counter & Subtotal */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] rounded-lg p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.product.id, -1)}
                                                            className="w-5 h-5 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-5 text-center text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.product.id, 1)}
                                                            className="w-5 h-5 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 w-16 text-right">
                                                        {formatRupiah(subtotal)}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.product.id)}
                                                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                                        title="Hapus dari keranjang"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Payment Dock */}
                            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                                {/* Total Tagihan */}
                                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                        TOTAL TAGIHAN:
                                    </span>
                                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono">
                                        {formatRupiah(grandTotal)}
                                    </span>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('tunai')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            paymentMethod === 'tunai'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Banknote className="w-4 h-4" />
                                        <span>Tunai (Cash)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod('qris');
                                            setQrisPaid(false);
                                        }}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            paymentMethod === 'qris'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <QrCode className="w-4 h-4" />
                                        <span>QRIS Dinamis</span>
                                    </button>
                                </div>

                                {/* Mode Tunai Calculation & Quick Presets */}
                                {paymentMethod === 'tunai' && (
                                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-[#121524]/60 border border-slate-200/80 dark:border-white/[0.06]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                Uang Diterima:
                                            </span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={amountReceived}
                                                    onChange={(e) => setAmountReceived(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold text-right bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Cash Presets */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={setExactCash}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors cursor-pointer"
                                            >
                                                Uang Pas
                                            </button>
                                            {[20000, 50000, 100000].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setPresetCash(preset)}
                                                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.14] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                                >
                                                    {formatRupiah(preset)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Validation Status & Kembalian */}
                                        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                            <span className="text-slate-500">Status Bayar:</span>
                                            {isUnderpaid ? (
                                                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>Kurang {formatRupiah(grandTotal - numAmountReceived)}</span>
                                                </span>
                                            ) : (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    Kembalian: {formatRupiah(changeAmount)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Mode QRIS Simulator */}
                                {paymentMethod === 'qris' && (
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121524]/60 border border-slate-200/80 dark:border-white/[0.06] text-center space-y-2.5">
                                        <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-slate-300 dark:border-white/20 shadow-xs flex items-center justify-center">
                                            <QrCode className="w-24 h-24 text-slate-900" />
                                        </div>
                                        <div className="text-xs font-mono">
                                            <span className="text-slate-500 block">QRIS Dinamis Nominal Pas:</span>
                                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                                {formatRupiah(grandTotal)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                playSuccessChime();
                                                setQrisPaid(true);
                                            }}
                                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                                qrisPaid
                                                    ? 'bg-emerald-600 text-white font-bold'
                                                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/25'
                                            }`}
                                        >
                                            {qrisPaid
                                                ? 'Pembayaran QRIS Terkonfirmasi'
                                                : 'Simulasikan Pelanggan Sukses Scan QRIS'}
                                        </button>
                                    </div>
                                )}

                                {/* Primary CTA: Process Payment & Print Receipt */}
                                <button
                                    type="button"
                                    onClick={handleProcessPayment}
                                    disabled={cart.length === 0 || (paymentMethod === 'tunai' && isUnderpaid)}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_8px_rgba(30,27,75,0.25)] border border-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Konfirmasi Pembayaran & Cetak Struk (F10)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* =========================================================================
                MODAL 1: THERMAL RECEIPT & PRINT PREVIEW
                ========================================================================= */}
            {showReceiptModal && lastCompletedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowReceiptModal(false)}
                >
                    <div
                        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Struk Kasir (Simulasi Thermal)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReceiptModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Paper Selector (58mm vs 80mm) */}
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Lebar Kertas:</span>
                            {['58mm', '80mm'].map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setReceiptPaperWidth(size)}
                                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                        receiptPaperWidth === size
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12] hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        {/* Receipt Slip View */}
                        <div
                            className={`mx-auto p-4 rounded-xl font-mono text-xs border shadow-inner ${
                                receiptPaperWidth === '58mm' ? 'max-w-[270px]' : 'max-w-[340px]'
                            } bg-slate-50 dark:bg-[#06070B] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 space-y-3`}
                        >
                            {/* Receipt Store Info */}
                            <div className="text-center space-y-1">
                                <h4 className="font-extrabold text-sm uppercase">KANTIN KASIR APP</h4>
                                <p className="text-[10px] text-slate-500">Jl. Pelajar Raya No. 42, Kampus Modern</p>
                                <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
                            </div>

                            <div className="border-t border-dashed border-slate-300 dark:border-white/20 pt-2 text-[10px] space-y-0.5">
                                <div className="flex justify-between">
                                    <span>Token Antrean:</span>
                                    <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        #{lastCompletedOrder.token_number}
                                    </strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Waktu:</span>
                                    <span>
                                        {lastCompletedOrder.date_str} {lastCompletedOrder.created_at}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kasir:</span>
                                    <span>Demo Staf POS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pelanggan:</span>
                                    <span>{lastCompletedOrder.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Layanan:</span>
                                    <span>{lastCompletedOrder.table_info}</span>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="border-t border-dashed border-slate-300 dark:border-white/20 pt-2 space-y-1.5 text-[11px]">
                                {lastCompletedOrder.items.map((item) => (
                                    <div key={item.id} className="space-y-0.5">
                                        <div className="flex justify-between font-bold">
                                            <span>{item.name}</span>
                                            <span>{formatRupiah(item.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>
                                                {item.quantity} x {formatRupiah(item.price)}
                                            </span>
                                            <span>{item.requires_kitchen ? '[KDS DAPUR]' : '[INSTAN KASIR]'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total & Payment Summary */}
                            <div className="border-t border-dashed border-slate-300 dark:border-white/20 pt-2 space-y-0.5 text-xs">
                                <div className="flex justify-between font-bold">
                                    <span>TOTAL:</span>
                                    <span className="text-sm">{formatRupiah(lastCompletedOrder.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>Metode:</span>
                                    <span>{lastCompletedOrder.payment_method}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>Bayar:</span>
                                    <span>{formatRupiah(lastCompletedOrder.amount_received)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>Kembalian:</span>
                                    <span>{formatRupiah(lastCompletedOrder.change_amount)}</span>
                                </div>
                            </div>

                            {/* Footer Greeting */}
                            <div className="border-t border-dashed border-slate-300 dark:border-white/20 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
                                <p>Terima kasih atas pesanan Anda.</p>
                                <p>Simpan struk ini untuk pengambilan pesanan.</p>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    playScannerBeep();
                                    window.print();
                                }}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Struk Thermal</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    clearCart();
                                    setShowReceiptModal(false);
                                }}
                                className="py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 cursor-pointer transition-colors"
                            >
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MODAL 2: KEYBOARD SHORTCUTS REFERENCE (F1)
                ========================================================================= */}
            {showHelpModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowHelpModal(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Pintasan Keyboard Terminal Kasir (Hotkeys)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                            {[
                                { key: 'F1', desc: 'Membuka panduan pintasan keyboard ini' },
                                { key: 'F2', desc: 'Fokus langsung ke kolom tembakan scanner barcode' },
                                { key: 'F4', desc: 'Mengisi otomatis contoh pesanan lengkap ke keranjang' },
                                { key: 'F9', desc: 'Mengosongkan seluruh item di keranjang transaksi' },
                                { key: 'F10', desc: 'Memproses pembayaran dan membuka modal cetak struk' },
                                { key: 'Esc', desc: 'Menutup dialog modal yang sedang aktif' },
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121524]/60 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3"
                                >
                                    <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white/10 text-white dark:text-indigo-300 border border-transparent dark:border-white/10 font-bold font-mono text-[11px]">
                                        {item.key}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 text-right flex-1">
                                        {item.desc}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                        >
                            Tutup Panduan (Esc)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
