import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Utensils,
    ShoppingBag,
    ChefHat,
    Zap,
    Plus,
    Minus,
    Trash2,
    CheckCircle2,
    Search,
    QrCode,
    CreditCard,
    Banknote,
    MessageSquare,
    ArrowRight,
    Store,
    Clock,
    X,
} from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

export default function CustomerQrMenu({
    table,
    categories = [],
    products = [],
}) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState({});
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Form submission
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        payment_method: 'qris',
        items: [],
    });

    // Add item to cart
    const addToCart = (product) => {
        setCart((prev) => {
            const currentQty = prev[product.id]?.quantity || 0;
            if (currentQty >= product.stock_qty) return prev;

            return {
                ...prev,
                [product.id]: {
                    product,
                    quantity: currentQty + 1,
                    notes: prev[product.id]?.notes || '',
                },
            };
        });
    };

    // Remove or decrement
    const removeFromCart = (productId) => {
        setCart((prev) => {
            const currentQty = prev[productId]?.quantity || 0;
            if (currentQty <= 1) {
                const updated = { ...prev };
                delete updated[productId];
                return updated;
            }
            return {
                ...prev,
                [productId]: {
                    ...prev[productId],
                    quantity: currentQty - 1,
                },
            };
        });
    };

    // Update item notes
    const updateItemNotes = (productId, notes) => {
        setCart((prev) => {
            if (!prev[productId]) return prev;
            return {
                ...prev,
                [productId]: {
                    ...prev[productId],
                    notes,
                },
            };
        });
    };

    // Calculations
    const cartEntries = Object.values(cart);
    const totalItems = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartEntries.reduce(
        (sum, item) => sum + item.quantity * Number(item.product.selling_price),
        0
    );

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesCat =
            selectedCategory === 'all' || product.category_id === Number(selectedCategory);
        const matchesQuery = product.product_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
    });

    // Handle Order Submit
    const handleSubmitOrder = (e) => {
        e.preventDefault();
        if (cartEntries.length === 0) return;

        const payloadItems = cartEntries.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            notes: item.notes || null,
        }));

        post(`/table/${table.qr_code_token}/order`, {
            items: payloadItems,
            customer_name: data.customer_name,
            payment_method: data.payment_method,
        });
    };

    return (
        <GuestAcrylicLayout title={`Menu ${table.table_number}`} centered={false}>
            <Head title={`Pesan dari Meja - ${table.table_number}`} />

            <div className="max-w-4xl mx-auto pb-32">
                {/* Table Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0B0D13] p-5 sm:p-6 mb-6 border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono font-medium mb-2.5">
                                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Meja: {table.table_number}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                                Pemesanan Meja {table.table_number}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Pilih menu makanan & minuman. Pesanan akan langsung diteruskan ke kasir dan dapur.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Meja Aktif</span>
                        </div>
                    </div>
                </div>

                {/* Search & Categories Bar */}
                <div className="space-y-3 mb-6">
                    {/* Quick Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari makanan atau minuman kesukaan Anda..."
                            className="w-full bg-[#0B0D13] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50 transition-colors"
                        />
                    </div>

                    {/* Category Scroll Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedCategory === 'all'
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                    : 'bg-[#0B0D13] text-slate-400 hover:text-white border border-white/[0.06]'
                            }`}
                        >
                            Semua Menu ({products.length})
                        </button>
                        {categories.map((cat) => {
                            const count = products.filter((p) => p.category_id === cat.id).length;
                            const isActive = selectedCategory === String(cat.id);

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(String(cat.id))}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        isActive
                                            ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                            : 'bg-[#0B0D13] text-slate-400 hover:text-white border border-white/[0.06]'
                                    }`}
                                >
                                    {cat.category_name} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-[#0B0D13] rounded-2xl border border-white/[0.06]">
                        <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">
                            Tidak ada menu dalam kategori ini
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Silakan pilih kategori lain atau ubah kata kunci pencarian.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        {filteredProducts.map((product) => {
                            const cartItem = cart[product.id];
                            const qtyInCart = cartItem?.quantity || 0;
                            const isOutOfStock = product.stock_qty <= 0;

                            return (
                                <AcrylicCard
                                    key={product.id}
                                    className="relative flex flex-col justify-between hover:border-white/[0.12] transition-all duration-200"
                                >
                                    <div>
                                        {/* Product Badges */}
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                                                {product.category?.category_name || 'Umum'}
                                            </span>

                                            {product.requires_kitchen ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                                                    Dimasak
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                                                    Instan
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Price */}
                                        <h3 className="text-sm font-semibold text-slate-200 tracking-tight leading-snug">
                                            {product.product_name}
                                        </h3>
                                        <div className="mt-2 text-base font-bold font-mono tabular-nums text-slate-100">
                                            Rp {Number(product.selling_price).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                            Stok: {product.stock_qty} porsi
                                        </div>
                                    </div>

                                    {/* Action Button / Stepper */}
                                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                        {qtyInCart === 0 ? (
                                            <SpecularButton
                                                size="sm"
                                                variant="primary"
                                                disabled={isOutOfStock}
                                                onClick={() => addToCart(product)}
                                                className="w-full"
                                                icon={Plus}
                                            >
                                                {isOutOfStock ? 'Habis' : 'Tambah'}
                                            </SpecularButton>
                                        ) : (
                                            <div className="w-full flex items-center justify-between bg-[#07080B] border border-white/[0.08] rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(product.id)}
                                                    className="w-7 h-7 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 flex items-center justify-center transition-colors"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="font-mono font-bold text-xs text-slate-100 px-2 tabular-nums">
                                                    {qtyInCart}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(product)}
                                                    disabled={qtyInCart >= product.stock_qty}
                                                    className="w-7 h-7 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </AcrylicCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Bottom Cart Bar */}
            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                    <div className="max-w-2xl mx-auto pointer-events-auto">
                        <div className="bg-gradient-to-b from-[#4338CA] to-[#312E81] border border-indigo-400/30 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white relative">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-[11px] font-bold font-mono flex items-center justify-center border-2 border-[#312E81] text-white">
                                        {totalItems}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-[11px] text-indigo-200">Total Pembayaran ({totalItems} item)</div>
                                    <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-white">
                                        Rp {subtotal.toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCartOpen(true)}
                                className="px-4 py-2 rounded-lg bg-white text-indigo-950 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                            >
                                <span>Lihat Pesanan</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart & Checkout Modal */}
            <AcrylicModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                title={`Keranjang ${table.table_number}`}
                subtitle="Periksa kembali daftar pesanan Anda dan lengkapi nama pemesan."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                    {/* Item List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {cartEntries.map((item) => (
                            <div
                                key={item.product.id}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate">
                                            {item.product.product_name}
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-400">
                                            @ Rp {Number(item.product.selling_price).toLocaleString('id-ID')}
                                        </div>
                                    </div>

                                    {/* Stepper */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 flex items-center justify-center"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-mono text-xs font-bold text-white min-w-5 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item.product)}
                                            disabled={item.quantity >= item.product.stock_qty}
                                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-30"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Custom notes for kitchen */}
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={item.notes}
                                        onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                                        placeholder="Catatan (cth: jangan terlalu pedas, es dipisah)..."
                                        className="w-full bg-black/30 border border-white/[0.06] rounded-md px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Customer Name */}
                    <AcrylicInput
                        label="Nama Pemesan (Wajib)"
                        required
                        placeholder="Contoh: Budi Santoso / Meja 3"
                        value={data.customer_name}
                        onChange={(e) => setData('customer_name', e.target.value)}
                        error={errors.customer_name}
                    />

                    {/* Payment Method Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setData('payment_method', 'qris')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    data.payment_method === 'qris'
                                        ? 'bg-white/[0.08] border-indigo-400/40 text-white'
                                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-semibold text-xs">
                                    <CreditCard className="w-4 h-4 text-indigo-400" />
                                    <span>QRIS (Otomatis)</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    BCA, GoPay, OVO, ShopeePay
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setData('payment_method', 'tunai')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    data.payment_method === 'tunai'
                                        ? 'bg-white/[0.08] border-emerald-400/40 text-white'
                                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-semibold text-xs">
                                    <Banknote className="w-4 h-4 text-emerald-400" />
                                    <span>Bayar Tunai</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Bayar langsung di kasir
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="p-3.5 rounded-xl bg-[#07080B] border border-white/[0.08] space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>Subtotal Menu ({totalItems} item)</span>
                            <span className="font-mono tabular-nums text-slate-200">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Pajak & Layanan</span>
                            <span className="font-mono text-emerald-400">Gratis (Rp 0)</span>
                        </div>
                        <div className="pt-2 border-t border-white/[0.06] flex justify-between font-bold text-sm text-slate-100">
                            <span>Total Pesanan</span>
                            <span className="font-mono tabular-nums text-slate-100">
                                Rp {subtotal.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                        <SpecularButton
                            variant="secondary"
                            onClick={() => setIsCartOpen(false)}
                        >
                            Tambah Menu Lain
                        </SpecularButton>
                        <SpecularButton
                            type="submit"
                            variant="primary"
                            loading={processing}
                            disabled={!data.customer_name.trim() || cartEntries.length === 0}
                            icon={CheckCircle2}
                        >
                            Kirim Pesanan Sekarang
                        </SpecularButton>
                    </div>
                </form>
            </AcrylicModal>
        </GuestAcrylicLayout>
    );
}

