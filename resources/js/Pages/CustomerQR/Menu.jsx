import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
    Flame,
    Star,
    Sparkles,
    Receipt,
    Check,
    Coffee,
    LayoutGrid,
    List,
} from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { toast } from '@/Services/toast';

function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Smart Appetizing Food Image Resolver
 */
function getProductImage(product) {
    if (product?.image_url && typeof product.image_url === 'string' && product.image_url.trim().length > 5) {
        return product.image_url.trim();
    }

    const name = (product?.product_name || '').toLowerCase();
    const cat = (product?.category?.category_name || '').toLowerCase();

    if (name.includes('nasi') || name.includes('rice')) {
        return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('mie') || name.includes('noodle') || name.includes('bihun') || name.includes('kwetiau')) {
        return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('kopi') || name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('aren')) {
        return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('teh') || name.includes('tea') || name.includes('matcha')) {
        return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('kentang') || name.includes('fries') || name.includes('snack') || name.includes('camilan') || name.includes('nugget')) {
        return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('ayam') || name.includes('chicken') || name.includes('daging') || name.includes('beef')) {
        return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('roti') || name.includes('toast') || name.includes('croissant') || name.includes('waffle')) {
        return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('minum') || cat.includes('drink')) {
        return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('snack') || cat.includes('dessert')) {
        return 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

/**
 * Appetizing Culinary Description Resolver
 */
function getProductDescription(product) {
    const name = (product?.product_name || '').toLowerCase();
    const cat = (product?.category?.category_name || '').toLowerCase();

    if (name.includes('nasi goreng')) {
        return 'Nasi goreng harum rempah gurih khas cafe dengan telur & pelengkap.';
    }
    if (name.includes('mie goreng')) {
        return 'Mie tumis saus spesial dengan seafood & sayuran segar.';
    }
    if (name.includes('kopi susu')) {
        return 'Espresso robusta berpadu susu segar & manis legit gula aren.';
    }
    if (name.includes('es teh') || name.includes('tea')) {
        return 'Seduhan daun teh wangi melati pilihan, manis pas & menyegarkan.';
    }
    if (name.includes('kentang') || name.includes('fries')) {
        return 'Kentang goreng renyah keemasan bertabur bumbu gurih.';
    }
    if (cat.includes('minum')) {
        return 'Minuman segar pilihan berkualitas untuk melengkapi santapan Anda.';
    }
    if (cat.includes('snack') || cat.includes('dessert')) {
        return 'Camilan renyah & lezat untuk dinikmati bersama teman.';
    }
    return 'Hidangan berkualitas dari bahan segar dengan cita rasa autentik.';
}

export default function CustomerQrMenu({
    table,
    categories = [],
    products = [],
    active_order = null,
}) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'chef' | 'instant'
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState({});
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Modals
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isPaymentGuideOpen, setIsPaymentGuideOpen] = useState(false);
    const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
    const [selectedProductDetail, setSelectedProductDetail] = useState(null);

    // Form submission
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        payment_method: 'qris',
        items: [],
    });

    // Add item to cart
    const addToCart = (product, customNotes = '') => {
        setCart((prev) => {
            const currentQty = prev[product.id]?.quantity || 0;
            if (currentQty >= product.stock_qty) {
                toast.warning(`Maksimal ${product.stock_qty} porsi untuk ${product.product_name}`, {
                    title: 'Batas Stok',
                });
                return prev;
            }

            toast.success(`${product.product_name} ditambahkan`, {
                title: 'Pesanan Bertambah',
                duration: 2400,
            });

            return {
                ...prev,
                [product.id]: {
                    product,
                    quantity: currentQty + 1,
                    notes: customNotes || prev[product.id]?.notes || '',
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
    const cartEntries = useMemo(() => Object.values(cart), [cart]);
    const totalItems = useMemo(
        () => cartEntries.reduce((sum, item) => sum + item.quantity, 0),
        [cartEntries]
    );
    const subtotal = useMemo(
        () =>
            cartEntries.reduce(
                (sum, item) => sum + item.quantity * Number(item.product.selling_price),
                0
            ),
        [cartEntries]
    );

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCat =
                selectedCategory === 'all' || product.category_id === Number(selectedCategory);

            let matchesQuick = true;
            if (quickFilter === 'chef') matchesQuick = Boolean(product.requires_kitchen && product.stock_qty > 0);
            if (quickFilter === 'instant') matchesQuick = !product.requires_kitchen;

            const matchesQuery = product.product_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            return matchesCat && matchesQuick && matchesQuery;
        });
    }, [products, selectedCategory, quickFilter, searchQuery]);

    // Top recommended item
    const featuredProduct = useMemo(() => {
        if (products.length === 0) return null;
        return products.find((p) => p.requires_kitchen && p.stock_qty > 0) || products[0];
    }, [products]);

    // Handle Order Submit
    const handleSubmitOrder = (e) => {
        if (e) e.preventDefault();
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
        <GuestAcrylicLayout fullScreen={true}>
            <Head title={`Menu Digital — ${table.table_number}`} />

            <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans">
                {/* ============================================================
                    1. COMPACT MOBILE-FIRST HERO HEADER (NO BULKY NAVBAR)
                ============================================================ */}
                <header className="relative w-full bg-[#0A0D15] border-b border-white/[0.08] overflow-hidden">
                    {/* Atmospheric Ambience Glow */}
                    <div className="absolute inset-0 z-0 opacity-15 mix-blend-luminosity scale-105 pointer-events-none">
                        <img
                            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                            alt="Resto Ambience"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#07090E]/80 via-[#0A0D15]/95 to-[#0A0D15] z-0 pointer-events-none" />

                    <div className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 pb-4 sm:pt-6 sm:pb-6 space-y-3.5">
                        {/* Top Action Buttons (Cart & Order Status) */}
                        <div className="flex items-center justify-end gap-2">
                            {totalItems > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsCartOpen(true)}
                                    className="h-8 sm:h-9 px-3 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#3730A3] border border-indigo-400/40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span className="font-mono">{totalItems} Menu</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsOrderStatusModalOpen(true)}
                                className="h-8 sm:h-9 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                title="Status Pesanan Meja"
                            >
                                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline">Status</span>
                            </button>
                        </div>

                        {/* Title & Cafe Info */}
                        <div>
                            <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-[11px] uppercase tracking-wider">
                                <Store className="w-3 h-3" />
                                <span>Pemesanan Digital Meja</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
                                Menu Kuliner {table.table_number}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
                                Pesan langsung dari meja Anda. Pesanan langsung diproses koki dapur & kasir tanpa antri.
                            </p>
                        </div>

                        {/* Active Order Alert (If Ongoing) */}
                        {active_order && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Clock className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                                    <div className="min-w-0 text-xs">
                                        <span className="text-amber-200 font-bold block truncate">
                                            Pesanan #{active_order.token_number} ({active_order.order_status})
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href={`/table/${table.qr_code_token}/order/${active_order.id}`}
                                    className="h-7 px-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0"
                                >
                                    <span>Lacak</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* ============================================================
                            2. MOBILE-FRIENDLY QUICK ACTION CHIPS (HORIZONTAL SCROLL)
                            Compact 1-row scrollable chips that don't crowd the screen
                        ============================================================ */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setQuickFilter(quickFilter === 'chef' ? 'all' : 'chef');
                                    setSelectedCategory('all');
                                }}
                                className={`shrink-0 h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
                                    quickFilter === 'chef'
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Rekomendasi Koki</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setQuickFilter(quickFilter === 'instant' ? 'all' : 'instant');
                                    setSelectedCategory('all');
                                }}
                                className={`shrink-0 h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
                                    quickFilter === 'instant'
                                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                                }`}
                            >
                                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Cepat Saji (Instan)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPaymentGuideOpen(true)}
                                className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all active:scale-95"
                            >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Cara Bayar</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOrderStatusModalOpen(true)}
                                className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all active:scale-95"
                            >
                                <Receipt className="w-3.5 h-3.5 text-indigo-300" />
                                <span>Riwayat Meja</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ============================================================
                    3. MAIN DINING BODY & RESPONSIVE FOOD GRID
                ============================================================ */}
                <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 pt-4 pb-36 space-y-4 sm:space-y-6 flex-1">
                    
                    {/* Sticky Search & Category Carousel */}
                    <div className="sticky top-0 z-20 bg-[#07090E]/95 backdrop-blur-md pt-1.5 pb-2.5 border-b border-white/[0.06] space-y-2.5">
                        {/* Search & View Toggle Row */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari makanan, kopi, minuman..."
                                    className="w-full h-10 bg-[#0E111B] border border-white/[0.08] focus:border-indigo-500/70 rounded-xl pl-9 pr-8 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* View Switcher: 2-Col Grid vs List */}
                            <div className="flex items-center bg-[#0E111B] border border-white/[0.08] rounded-xl p-0.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="Tampilan Grid 2-Kolom"
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="Tampilan List Kompak"
                                >
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Category Pills (Horizontal Touch Swipe) */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setQuickFilter('all');
                                }}
                                className={`shrink-0 min-h-[34px] px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
                                    selectedCategory === 'all' && quickFilter === 'all'
                                        ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border border-indigo-400/35 shadow-sm'
                                        : 'bg-[#0E111B] text-slate-400 hover:text-white border border-white/[0.06]'
                                }`}
                            >
                                <span>Semua Menu</span>
                                <span className="font-mono text-[10px] opacity-75 bg-black/25 px-1.5 py-0.5 rounded">
                                    {products.length}
                                </span>
                            </button>

                            {categories.map((cat) => {
                                const count = products.filter((p) => p.category_id === cat.id).length;
                                const isActive = selectedCategory === String(cat.id) && quickFilter === 'all';

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(String(cat.id));
                                            setQuickFilter('all');
                                        }}
                                        className={`shrink-0 min-h-[34px] px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border border-indigo-400/35 shadow-sm'
                                                : 'bg-[#0E111B] text-slate-400 hover:text-white border border-white/[0.06]'
                                        }`}
                                    >
                                        <span>{cat.category_name}</span>
                                        <span className="font-mono text-[10px] opacity-75 bg-black/25 px-1.5 py-0.5 rounded">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Compact Mobile Spotlight Banner (When All Selected) */}
                    {selectedCategory === 'all' && quickFilter === 'all' && !searchQuery && featuredProduct && (
                        <div
                            onClick={() => setSelectedProductDetail(featuredProduct)}
                            className="p-3 sm:p-4 rounded-2xl bg-[#0D101A] border border-amber-500/25 shadow-md flex items-center gap-3 sm:gap-4 cursor-pointer hover:border-amber-500/40 transition-all active:scale-[0.99] group"
                        >
                            <img
                                src={getProductImage(featuredProduct)}
                                alt={featuredProduct.product_name}
                                className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 bg-slate-900 border border-white/10"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>Paling Diminati</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-200 transition-colors">
                                    {featuredProduct.product_name}
                                </h3>
                                <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                                    {formatRupiah(featuredProduct.selling_price)}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(featuredProduct);
                                }}
                                className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Pesan</span>
                            </button>
                        </div>
                    )}

                    {/* ============================================================
                        4. FOOD CARDS (RESPONSIVE: 2-COL MOBILE / 3-COL DESKTOP)
                    ============================================================ */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 bg-[#0C0E16] rounded-2xl border border-white/[0.06] p-6">
                            <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <h3 className="text-sm font-bold text-slate-200">
                                Menu Tidak Ditemukan
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setQuickFilter('all');
                                }}
                                className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-500/30 rounded-xl"
                            >
                                Reset Filter
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* TAMPILAN 1: 2-KOLOM MOBILE / 3-KOLOM TABLET / 4-KOLOM DESKTOP */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                            {filteredProducts.map((product) => {
                                const cartItem = cart[product.id];
                                const qtyInCart = cartItem?.quantity || 0;
                                const isOutOfStock = product.stock_qty <= 0;
                                const isLowStock = product.stock_qty > 0 && product.stock_qty <= 5;
                                const photoUrl = getProductImage(product);

                                return (
                                    <div
                                        key={product.id}
                                        className="group relative rounded-2xl bg-[#0C0E16] border border-white/[0.08] hover:border-indigo-500/35 overflow-hidden shadow-sm flex flex-col justify-between transition-all"
                                    >
                                        {/* Image Section */}
                                        <div
                                            onClick={() => setSelectedProductDetail(product)}
                                            className="relative h-32 sm:h-40 w-full overflow-hidden bg-slate-900 cursor-pointer"
                                            title="Ketuk untuk melihat rincian & catatan"
                                        >
                                            <img
                                                src={photoUrl}
                                                alt={product.product_name}
                                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
                                                    isOutOfStock ? 'grayscale opacity-50' : ''
                                                }`}
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E16] via-transparent to-black/30 pointer-events-none" />

                                            {/* Badges on Top */}
                                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 truncate max-w-[80px]">
                                                    {product.category?.category_name || 'Menu'}
                                                </span>

                                                {product.requires_kitchen ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                                        <ChefHat className="w-2.5 h-2.5" />
                                                        <span className="hidden sm:inline">Dapur</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                                                        <Zap className="w-2.5 h-2.5" />
                                                        <span className="hidden sm:inline">Instan</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Out of Stock Label */}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-2 text-center">
                                                    <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono uppercase">
                                                        Habis
                                                    </span>
                                                </div>
                                            )}

                                            {/* Low Stock Indicator */}
                                            {!isOutOfStock && isLowStock && (
                                                <div className="absolute bottom-1.5 left-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-bold font-mono flex items-center gap-0.5">
                                                        <Flame className="w-2.5 h-2.5 fill-current" />
                                                        <span>Sisa {product.stock_qty}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Info & Stepper */}
                                        <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2">
                                            <div
                                                onClick={() => setSelectedProductDetail(product)}
                                                className="cursor-pointer"
                                            >
                                                <h3
                                                    className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight line-clamp-1 group-hover:text-indigo-200 transition-colors"
                                                    title={product.product_name}
                                                >
                                                    {product.product_name}
                                                </h3>
                                                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 mt-1">
                                                    {formatRupiah(product.selling_price)}
                                                </div>
                                            </div>

                                            {/* Action Control: Add or Compact Stepper */}
                                            <div className="pt-1">
                                                {qtyInCart === 0 ? (
                                                    <button
                                                        type="button"
                                                        disabled={isOutOfStock}
                                                        onClick={() => addToCart(product)}
                                                        className={`w-full min-h-[38px] sm:min-h-[40px] px-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                                            isOutOfStock
                                                                ? 'bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] hover:from-[#3730A3] hover:to-[#312E81] text-white border border-indigo-400/30 shadow-sm'
                                                        }`}
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>{isOutOfStock ? 'Habis' : 'Tambah'}</span>
                                                    </button>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="w-full min-h-[38px] flex items-center justify-between bg-[#08090D] border border-indigo-500/40 rounded-xl p-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromCart(product.id)}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.06] text-slate-200 flex items-center justify-center active:scale-95"
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="font-mono font-bold text-xs text-white px-1">
                                                                {qtyInCart}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addToCart(product)}
                                                                disabled={qtyInCart >= product.stock_qty}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center active:scale-95 disabled:opacity-40"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProductDetail(product)}
                                                            className="w-full text-center text-[10px] text-slate-400 hover:text-indigo-300 truncate block py-0.5"
                                                        >
                                                            {cartItem.notes ? 'Catatan ✓' : '+ Catatan'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* TAMPILAN 2: LIST ROW KOMPAK MOBILE (FOOD DELIVERY STYLE) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {filteredProducts.map((product) => {
                                const cartItem = cart[product.id];
                                const qtyInCart = cartItem?.quantity || 0;
                                const isOutOfStock = product.stock_qty <= 0;
                                const photoUrl = getProductImage(product);
                                const description = getProductDescription(product);

                                return (
                                    <div
                                        key={product.id}
                                        className="p-3 rounded-2xl bg-[#0C0E16] border border-white/[0.08] hover:border-indigo-500/35 transition-all shadow-sm flex items-center gap-3 group"
                                    >
                                        <div
                                            onClick={() => setSelectedProductDetail(product)}
                                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer border border-white/10"
                                        >
                                            <img
                                                src={photoUrl}
                                                alt={product.product_name}
                                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
                                                    isOutOfStock ? 'grayscale opacity-50' : ''
                                                }`}
                                            />
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold font-mono text-rose-300">Habis</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div
                                                onClick={() => setSelectedProductDetail(product)}
                                                className="cursor-pointer"
                                            >
                                                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-indigo-200">
                                                    {product.product_name}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                                                    {description}
                                                </p>
                                                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 mt-0.5">
                                                    {formatRupiah(product.selling_price)}
                                                </div>
                                            </div>

                                            <div className="pt-1 flex items-center justify-between gap-2">
                                                {qtyInCart === 0 ? (
                                                    <button
                                                        type="button"
                                                        disabled={isOutOfStock}
                                                        onClick={() => addToCart(product)}
                                                        className="h-8 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white flex items-center gap-1 active:scale-95 disabled:opacity-40"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        <span>Tambah</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 bg-[#08090D] border border-indigo-500/40 rounded-lg p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(product.id)}
                                                            className="w-7 h-7 rounded bg-white/[0.06] text-white flex items-center justify-center"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="font-mono font-bold text-xs text-white px-1.5">
                                                            {qtyInCart}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => addToCart(product)}
                                                            disabled={qtyInCart >= product.stock_qty}
                                                            className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProductDetail(product)}
                                                    className="text-[11px] text-indigo-300 hover:text-white"
                                                >
                                                    Detail
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* ============================================================
                    5. MOBILE SAFE FLOATING CHECKOUT BAR
                ============================================================ */}
                {totalItems > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pb-5 bg-gradient-to-t from-black via-[#07090E]/95 to-transparent pointer-events-none">
                        <div className="max-w-lg mx-auto pointer-events-auto">
                            <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] border border-indigo-400/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white relative shrink-0">
                                        <ShoppingBag className="w-4 h-4" />
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-emerald-500 text-[10px] font-bold font-mono flex items-center justify-center border border-[#1E1B4B] text-white">
                                            {totalItems}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[11px] text-indigo-200 truncate">
                                            {totalItems} Menu di {table.table_number}
                                        </div>
                                        <div className="text-base font-bold font-mono tabular-nums text-white truncate">
                                            {formatRupiah(subtotal)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsCartOpen(true)}
                                    className="min-h-[42px] px-4 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                                >
                                    <span>Konfirmasi</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================
                    MODAL 1: CART & CHECKOUT (MOBILE ERGONOMIC)
                ============================================================ */}
                <AcrylicModal
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    title={`Konfirmasi Pesanan — ${table.table_number}`}
                    subtitle="Periksa rincian menu dan isi nama pemesan sebelum dikirim ke koki dapur & kasir."
                    maxWidth="max-w-md"
                >
                    <form onSubmit={handleSubmitOrder} className="space-y-4">
                        {/* Scrollable Item List */}
                        <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                            {cartEntries.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="p-3 rounded-xl bg-[#090B12] border border-white/[0.06] space-y-2"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <img
                                            src={getProductImage(item.product)}
                                            alt={item.product.product_name}
                                            className="w-11 h-11 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/10"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-white truncate">
                                                {item.product.product_name}
                                            </div>
                                            <div className="text-xs font-mono text-emerald-400 font-semibold">
                                                {formatRupiah(item.product.selling_price)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 bg-[#06070A] p-0.5 rounded-lg border border-white/[0.08]">
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="w-6 h-6 rounded bg-white/[0.06] text-slate-300 flex items-center justify-center"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="font-mono text-xs font-bold text-white min-w-4 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item.product)}
                                                disabled={item.quantity >= item.product.stock_qty}
                                                className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center disabled:opacity-30"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                                        <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
                                        <input
                                            type="text"
                                            value={item.notes}
                                            onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                                            placeholder="Catatan koki (pedas sedang, es sedikit)..."
                                            className="w-full bg-black/40 border border-white/[0.06] rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none"
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

                        {/* Payment Selector */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-300">
                                Metode Pembayaran
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData('payment_method', 'qris')}
                                    className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                                        data.payment_method === 'qris'
                                            ? 'bg-indigo-950/70 border-indigo-400/50 text-white ring-1 ring-indigo-500/30'
                                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>QRIS Instan</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        BCA, GoPay, OVO, Shopee
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setData('payment_method', 'tunai')}
                                    className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                                        data.payment_method === 'tunai'
                                            ? 'bg-emerald-950/70 border-emerald-400/50 text-white ring-1 ring-emerald-500/30'
                                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Bayar di Kasir</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        Tunai di counter kasir
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Total Summary */}
                        <div className="p-3 rounded-xl bg-[#080A10] border border-white/[0.08] flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-sans">Total ({totalItems} Menu):</span>
                            <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                                {formatRupiah(subtotal)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                            <button
                                type="button"
                                onClick={() => setIsCartOpen(false)}
                                className="h-10 px-3.5 text-xs font-semibold text-slate-400 hover:text-white"
                            >
                                Kembali
                            </button>
                            <SpecularButton
                                type="submit"
                                variant="primary"
                                loading={processing}
                                disabled={!data.customer_name.trim() || cartEntries.length === 0}
                                icon={CheckCircle2}
                            >
                                Kirim Pesanan
                            </SpecularButton>
                        </div>
                    </form>
                </AcrylicModal>

                {/* ============================================================
                    MODAL 2: ORDER STATUS / LACAK DAPUR
                ============================================================ */}
                <AcrylicModal
                    isOpen={isOrderStatusModalOpen}
                    onClose={() => setIsOrderStatusModalOpen(false)}
                    title={`Status Pesanan — ${table.table_number}`}
                    subtitle="Pantau antrian pesanan yang sedang dipersiapkan untuk meja ini."
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4">
                        {active_order ? (
                            <div className="p-4 rounded-xl bg-[#090B12] border border-amber-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-slate-400">Token Antrian</span>
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold uppercase">
                                        {active_order.order_status}
                                    </span>
                                </div>

                                <div className="text-center py-2">
                                    <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                                        #{active_order.token_number}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Atas nama <strong className="text-white">{active_order.customer_name}</strong>
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-white/[0.06] flex justify-between text-xs text-slate-400 font-mono">
                                    <span>Total Tagihan:</span>
                                    <span className="text-emerald-400 font-bold">{formatRupiah(active_order.total_amount)}</span>
                                </div>

                                <Link
                                    href={`/table/${table.qr_code_token}/order/${active_order.id}`}
                                    className="w-full min-h-[40px] mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <span>Buka Pelacakan Koki Lengkap</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-2">
                                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                                <div className="text-sm font-bold text-white">Belum Ada Pesanan Aktif</div>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Belum ada pesanan yang berjalan untuk {table.table_number}. Silakan pilih menu di atas!
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                            <SpecularButton
                                variant="secondary"
                                onClick={() => setIsOrderStatusModalOpen(false)}
                            >
                                Tutup
                            </SpecularButton>
                        </div>
                    </div>
                </AcrylicModal>

                {/* ============================================================
                    MODAL 3: PANDUAN CARA BAYAR
                ============================================================ */}
                <AcrylicModal
                    isOpen={isPaymentGuideOpen}
                    onClose={() => setIsPaymentGuideOpen(false)}
                    title="Panduan Pembayaran"
                    subtitle="Metode pembayaran yang tersedia di cafe kami."
                    maxWidth="max-w-md"
                >
                    <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30 space-y-1">
                            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                                <CreditCard className="w-4 h-4" />
                                <span>1. QRIS Instan</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Dukungan semua e-wallet & m-banking (BCA, GoPay, OVO, ShopeePay, Dana). Terverifikasi otomatis.
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-1">
                            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                                <Banknote className="w-4 h-4" />
                                <span>2. Bayar Tunai di Kasir</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Kirim pesanan dari meja, lalu bayar langsung di meja kasir dengan menyebutkan nomor meja atau token.
                            </p>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                            <SpecularButton
                                variant="secondary"
                                onClick={() => setIsPaymentGuideOpen(false)}
                            >
                                Mengerti
                            </SpecularButton>
                        </div>
                    </div>
                </AcrylicModal>

                {/* ============================================================
                    MODAL 4: FOOD DETAIL & CUSTOM NOTES
                ============================================================ */}
                {selectedProductDetail && (
                    <AcrylicModal
                        isOpen={Boolean(selectedProductDetail)}
                        onClose={() => setSelectedProductDetail(null)}
                        title={selectedProductDetail.product_name}
                        subtitle={`Kategori: ${selectedProductDetail.category?.category_name || 'Umum'}`}
                        maxWidth="max-w-md"
                    >
                        <div className="space-y-3.5">
                            <div className="relative h-44 sm:h-52 w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                                <img
                                    src={getProductImage(selectedProductDetail)}
                                    alt={selectedProductDetail.product_name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-emerald-400 font-mono font-bold text-sm">
                                    {formatRupiah(selectedProductDetail.selling_price)}
                                </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                {getProductDescription(selectedProductDetail)}
                            </p>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                    Catatan Khusus untuk Koki:
                                </label>
                                <textarea
                                    rows="2"
                                    defaultValue={cart[selectedProductDetail.id]?.notes || ''}
                                    id="product-custom-note"
                                    placeholder="Contoh: jangan terlalu manis, sambal dipisah, es sedikit..."
                                    className="w-full bg-[#08090D] border border-white/[0.08] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProductDetail(null)}
                                    className="h-10 px-3 text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const noteVal = document.getElementById('product-custom-note')?.value || '';
                                        addToCart(selectedProductDetail, noteVal);
                                        setSelectedProductDetail(null);
                                    }}
                                    className="flex-1 min-h-[42px] px-3 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambahkan ke Meja</span>
                                </button>
                            </div>
                        </div>
                    </AcrylicModal>
                )}
            </div>
        </GuestAcrylicLayout>
    );
}
