import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    CreditCard,
    QrCode,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Utensils,
    Package,
    Store,
    ArrowRight,
    Send,
    Bell,
    Check,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
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

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [expandedNotesId, setExpandedNotesId] = useState(null);

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
        if (product.stock_qty <= 0 || !product.is_available) return;

        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_qty) {
                    alert(`Stok tidak mencukupi. Maksimal ${product.stock_qty} unit.`);
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
        setCart((prev) =>
            prev
                .map((i) => {
                    if (i.id === productId) {
                        const newQty = i.quantity + delta;
                        if (newQty > i.stock_qty) {
                            alert(`Stok tidak mencukupi (sisa ${i.stock_qty}).`);
                            return i;
                        }
                        return newQty > 0 ? { ...i, quantity: newQty } : null;
                    }
                    return i;
                })
                .filter(Boolean)
        );
    };

    const updateCartNotes = (productId, notes) => {
        setCart((prev) =>
            prev.map((i) => (i.id === productId ? { ...i, notes } : i))
        );
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((i) => i.id !== productId));
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

    return (
        <AuthenticatedLayout
            title="Kasir POS Terminal"
            scannerStatus={scannerStatus}
            lastScannedBarcode={lastScannedBarcode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => setSearchQuery(q)}
            showSearch={true}
            headerRight={
                active_shift ? (
                    <SpecularButton
                        variant="secondary"
                        size="sm"
                        icon={Clock}
                        onClick={() => {
                            setCloseShiftData('closing_cash_actual', Number(active_shift.opening_cash) + Number(active_shift.total_cash_sales));
                            setIsCloseShiftModalOpen(true);
                        }}
                    >
                        <span>Tutup Shift ({active_shift.shift_name})</span>
                    </SpecularButton>
                ) : (
                    <SpecularButton
                        variant="primary"
                        size="sm"
                        icon={Clock}
                        onClick={() => setIsOpenShiftModalOpen(true)}
                    >
                        <span>Buka Shift Baru</span>
                    </SpecularButton>
                )
            }
        >
            <Head title="Kasir POS - Order & Kasir Terminal" />

            {/* Shift Inactive Warning Banner */}
            {!active_shift && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3 text-xs">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                            <span className="font-semibold block text-slate-100">Sesi Shift Belum Dibuka</span>
                            <span className="text-[11px] text-slate-400">
                                Harap masukkan modal awal kasir sebelum memproses transaksi agar rekapitulasi kas tercatat akurat.
                            </span>
                        </div>
                    </div>
                    <SpecularButton
                        variant="primary"
                        size="sm"
                        onClick={() => setIsOpenShiftModalOpen(true)}
                    >
                        Buka Shift Sekarang
                    </SpecularButton>
                </div>
            )}

            {/* Fulfillment Notification Bar (Kitchen Handshake: Ready Orders) */}
            {fulfillment_orders.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0B0D13] border border-emerald-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-emerald-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Pesanan Selesai dari Dapur (Siap Diserahkan):
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                            {fulfillment_orders.length} Antrean
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {fulfillment_orders.map((ord) => (
                            <div
                                key={ord.id}
                                className="flex-shrink-0 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs"
                            >
                                <div>
                                    <span className="font-mono font-bold text-emerald-300 text-sm">
                                        #{ord.token_number}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        {ord.table ? ord.table.table_number : 'Takeaway'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleServeOrder(ord.id)}
                                    className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-[11px] transition-all flex items-center gap-1"
                                    title="Konfirmasi bahwa makanan telah diterima pelanggan"
                                >
                                    <Check className="w-3.5 h-3.5" />
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
                    {/* Search & Category Tabs */}
                    <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl p-3.5 space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama menu atau scan barcode..."
                                className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50 transition-colors"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                        : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                                }`}
                            >
                                Semua Menu
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(c.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                        selectedCategory === c.id
                                            ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                            : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                                    }`}
                                >
                                    {c.category_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-500 bg-[#0B0D13] rounded-xl border border-white/[0.06] text-xs">
                                Tidak ada menu yang cocok dengan pencarian.
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
                                        className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between h-36 relative select-none group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] ${
                                            isOutOfStock
                                                ? 'bg-[#0B0D13]/50 border-white/[0.04] opacity-50 cursor-not-allowed'
                                                : 'bg-[#0B0D13] hover:bg-[#10131C] border-white/[0.06] hover:border-white/[0.12] active:scale-[0.99]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-[10px] mb-1.5">
                                                <span className="font-mono text-slate-400">
                                                    {p.barcode || 'NO-BARCODE'}
                                                </span>
                                                {p.requires_kitchen ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                                                        KDS
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                                                        Instan
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-white transition-colors">
                                                {p.product_name}
                                            </h4>
                                        </div>

                                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                                            <span className="font-mono font-bold text-xs text-slate-100 tabular-nums">
                                                {formatRupiah(p.selling_price)}
                                            </span>
                                            {isOutOfStock ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    Habis
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="text-[10px] font-mono text-amber-400 tabular-nums">
                                                    Sisa {p.stock_qty}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
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
                    <AcrylicCard
                        title="Keranjang Pesanan Aktif"
                        subtitle="Atur meja, pesanan pelanggan, dan konfirmasi transaksi"
                        contentClassName="p-4 space-y-4"
                    >
                        {/* Order Type & Table Selector */}
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOrderSource('cashier_direct')}
                                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                        orderSource === 'cashier_direct'
                                            ? 'bg-white/[0.08] border-indigo-400/40 text-white font-semibold'
                                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Takeaway / Langsung
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderSource('qr_table')}
                                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                        orderSource === 'qr_table'
                                            ? 'bg-white/[0.08] border-indigo-400/40 text-white font-semibold'
                                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Dine-in (Meja)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {orderSource === 'qr_table' && (
                                    <div>
                                        <label className="text-[11px] text-slate-400 block mb-1">
                                            Pilih Meja:
                                        </label>
                                        <select
                                            value={selectedTableId}
                                            onChange={(e) => setSelectedTableId(e.target.value)}
                                            className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                                        >
                                            <option value="">Pilih Nomor Meja</option>
                                            {dining_tables.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.table_number} ({t.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className={orderSource === 'qr_table' ? '' : 'col-span-2'}>
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                        Nama Pelanggan:
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Pelanggan Walk-in"
                                        className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {cart.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 text-xs">
                                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                                    <span>Belum ada item di keranjang. Klik menu di samping atau scan barcode.</span>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-semibold text-slate-200">
                                                    {item.product_name}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                                                    {formatRupiah(item.selling_price)}
                                                </div>
                                            </div>
                                            <div className="text-right font-mono font-bold text-slate-100 text-xs tabular-nums">
                                                {formatRupiah(item.selling_price * item.quantity)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1">
                                            {/* Quantity Stepper */}
                                            <div className="flex items-center gap-1.5 bg-[#07080B] border border-white/[0.08] rounded-lg p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartQty(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-7 text-center font-mono font-bold text-xs text-slate-200 tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartQty(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Notes Toggle & Delete */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedNotesId(
                                                            expandedNotesId === item.id ? null : item.id
                                                        )
                                                    }
                                                    className="text-[10px] text-indigo-400 hover:underline"
                                                >
                                                    {item.notes ? 'Catatan: ' + item.notes : '+ Catatan'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedNotesId === item.id && (
                                            <input
                                                type="text"
                                                value={item.notes}
                                                onChange={(e) => updateCartNotes(item.id, e.target.value)}
                                                placeholder="Contoh: Pedas level 2, jangan pakai daun bawang"
                                                className="w-full bg-[#07080B] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-400/50"
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Grand Total Bar */}
                        <div className="p-3.5 rounded-xl bg-[#07080B] border border-white/[0.08] space-y-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>Total Item:</span>
                                <span className="text-slate-200 font-semibold">{cartTotals.totalItems} unit</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                                <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                                    Total Tagihan
                                </span>
                                <span className="text-2xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
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
                            className="w-full"
                            icon={ArrowRight}
                            iconPosition="right"
                        >
                            Konfirmasi Pesanan & Bayar
                        </SpecularButton>
                    </AcrylicCard>
                </div>
            </div>

            {/* =========================================================
                MODAL: KONFIRMASI PEMBAYARAN & HITUNG KEMBALIAN
               ========================================================= */}
            <AcrylicModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Konfirmasi Pembayaran Kasir"
                subtitle={`Total Tagihan: ${formatRupiah(cartTotals.totalAmount)} (${cartTotals.totalItems} Items)`}
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
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
                        >
                            Proses & Cetak Struk
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCheckout} className="space-y-4">
                    {/* Payment Method Selector */}
                    <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutData('payment_method', 'tunai');
                                    setCheckoutData('amount_received', cartTotals.totalAmount);
                                }}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                                    checkoutData.payment_method === 'tunai'
                                        ? 'bg-white/[0.08] border-indigo-400/40 text-white'
                                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                            >
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span>Tunai (Cash)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutData('payment_method', 'qris');
                                    setCheckoutData('amount_received', cartTotals.totalAmount);
                                }}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                                    checkoutData.payment_method === 'qris'
                                        ? 'bg-white/[0.08] border-indigo-400/40 text-white'
                                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                            >
                                <QrCode className="w-4 h-4 text-indigo-400" />
                                <span>QRIS Dinamis</span>
                            </button>
                        </div>
                    </div>

                    {/* QRIS Simulated Display */}
                    {checkoutData.payment_method === 'qris' && (
                        <div className="p-4 rounded-xl bg-[#07080B] border border-white/[0.08] text-center space-y-2">
                            <div className="w-24 h-24 mx-auto rounded-lg bg-white p-2 flex items-center justify-center">
                                <QrCode className="w-20 h-20 text-slate-900" />
                            </div>
                            <span className="text-xs text-indigo-300 font-mono block">
                                QRIS Siap Discan Pelanggan
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                                Jumlah Pembayaran Pas: {formatRupiah(cartTotals.totalAmount)}
                            </span>
                        </div>
                    )}

                    {/* Cash Calculator & Quick Presets */}
                    {checkoutData.payment_method === 'tunai' && (
                        <div className="space-y-3">
                            <AcrylicInput
                                label="Uang Fisik Diterima (Rp)"
                                type="number"
                                min={cartTotals.totalAmount}
                                value={checkoutData.amount_received}
                                onChange={(e) =>
                                    setCheckoutData('amount_received', parseFloat(e.target.value) || 0)
                                }
                                error={checkoutErrors.amount_received}
                                required
                            />

                            {/* Quick Preset Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleQuickCash(cartTotals.totalAmount)}
                                    className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-slate-200 border border-white/[0.08]"
                                >
                                    Uang Pas
                                </button>
                                {[20000, 50000, 100000, 200000].map((nominal) => (
                                    <button
                                        key={nominal}
                                        type="button"
                                        onClick={() => handleQuickCash(nominal)}
                                        className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-slate-200 border border-white/[0.08]"
                                    >
                                        {formatRupiah(nominal)}
                                    </button>
                                ))}
                            </div>

                            {/* Underpayment Warning */}
                            {isUnderpaid && (
                                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        Uang diterima kurang dari total belanja! Minimal{' '}
                                        {formatRupiah(cartTotals.totalAmount)}.
                                    </span>
                                </div>
                            )}

                            {/* Change Box */}
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                                <span className="text-xs font-medium text-emerald-400">
                                    Uang Kembalian:
                                </span>
                                <span className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
                                    {formatRupiah(changeAmount)}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL: BUKA SHIFT BARU
               ========================================================= */}
            <AcrylicModal
                isOpen={isOpenShiftModalOpen}
                onClose={() => setIsOpenShiftModalOpen(false)}
                title="Buka Sesi Shift Kasir Baru"
                subtitle="Masukkan nama shift dan modal uang fisik di laci kasir"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsOpenShiftModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
                            loading={openShiftProcessing}
                            onClick={handleSubmitOpenShift}
                        >
                            Buka Shift
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitOpenShift} className="space-y-4">
                    <AcrylicInput
                        label="Nama Shift"
                        value={openShiftData.shift_name}
                        onChange={(e) => setOpenShiftData('shift_name', e.target.value)}
                        placeholder="Contoh: Shift Pagi, Shift Siang"
                        error={openShiftErrors.shift_name}
                        required
                    />

                    <AcrylicInput
                        label="Modal Awal Kasir (Opening Cash Rp)"
                        type="number"
                        min="0"
                        value={openShiftData.opening_cash}
                        onChange={(e) =>
                            setOpenShiftData('opening_cash', parseFloat(e.target.value) || 0)
                        }
                        error={openShiftErrors.opening_cash}
                        required
                    />

                    <AcrylicInput
                        label="Catatan Tambahan (Opsional)"
                        value={openShiftData.notes}
                        onChange={(e) => setOpenShiftData('notes', e.target.value)}
                        placeholder="Misal: Kondisi laci uang rapi, uang kembalian pecahan lengkap"
                    />
                </form>
            </AcrylicModal>

            {/* =========================================================
                MODAL: TUTUP SHIFT KASIR
               ========================================================= */}
            <AcrylicModal
                isOpen={isCloseShiftModalOpen}
                onClose={() => setIsCloseShiftModalOpen(false)}
                title="Tutup Sesi Shift Kasir"
                subtitle={active_shift ? `Rekonsiliasi Shift: ${active_shift.shift_name}` : ''}
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCloseShiftModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="sm"
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
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono space-y-1.5">
                            <div className="flex justify-between text-slate-400">
                                <span>Modal Awal:</span>
                                <span className="text-white">{formatRupiah(active_shift.opening_cash)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Penjualan Tunai:</span>
                                <span className="text-white">{formatRupiah(active_shift.total_cash_sales)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Penjualan QRIS:</span>
                                <span className="text-indigo-300">{formatRupiah(active_shift.total_qris_sales)}</span>
                            </div>
                            <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-white/[0.08]">
                                <span>Ekspektasi Uang Tunai di Laci:</span>
                                <span className="text-emerald-400">
                                    {formatRupiah(Number(active_shift.opening_cash) + Number(active_shift.total_cash_sales))}
                                </span>
                            </div>
                        </div>

                        <AcrylicInput
                            label="Uang Fisik Aktual Hasil Hitungan (Closing Cash Rp)"
                            type="number"
                            min="0"
                            value={closeShiftData.closing_cash_actual}
                            onChange={(e) =>
                                setCloseShiftData('closing_cash_actual', parseFloat(e.target.value) || 0)
                            }
                            error={closeShiftErrors.closing_cash_actual}
                            required
                        />

                        <AcrylicInput
                            label="Keterangan / Alasan Selisih Kas (Jika Ada)"
                            value={closeShiftData.notes}
                            onChange={(e) => setCloseShiftData('notes', e.target.value)}
                            placeholder="Misal: Uang receh kembalian kurang, fisik cocok"
                        />
                    </form>
                )}
            </AcrylicModal>
        </AuthenticatedLayout>
    );
}

