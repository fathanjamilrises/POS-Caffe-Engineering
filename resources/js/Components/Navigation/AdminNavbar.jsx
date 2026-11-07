import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/Theme/ThemeToggle';
import {
    Search,
    Menu,
    X,
    LayoutDashboard,
    Package,
    UtensilsCrossed,
    QrCode,
    ChefHat,
    Users,
} from 'lucide-react';

/**
 * AdminNavbar: Sleek, architectural sticky top control bar.
 * Designed for 40-60 yo staff operating tablet POS:
 * - 100% sticky to the viewport (top-0 z-30 with backdrop-blur-md).
 * - Reduced pill bar clutter (clean text & dividers instead of nested pill boxes).
 * - Quick-clear search input with generous 42px touch target.
 * - Prominent, high-contrast title with station icon indicator.
 * - Live real-time clock without decorative capsule boxes.
 */
export default function AdminNavbar({
    title = 'Beranda',
    searchQuery = '',
    setSearchQuery = null,
    onQuickSearch = null,
    searchPlaceholder = 'Cari...',
    showSearch = true,
    actions = null,
    onToggleMobileMenu = null,
    scannerStatus = 'ready',
    lastScannedBarcode = '',
}) {
    const { auth = {} } = usePage().props;
    const user = auth?.user;

    // Real-time digital clock
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }) + ' WIB'
            );
            setCurrentDate(
                now.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                })
            );
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleClearSearch = () => {
        if (setSearchQuery) setSearchQuery('');
        if (onQuickSearch) onQuickSearch('');
    };

    // Determine station icon based on current page title
    const getStationIcon = () => {
        const t = (title || '').toLowerCase();
        if (t.includes('beranda') || t.includes('dashboard')) return LayoutDashboard;
        if (t.includes('produk') || t.includes('stok')) return Package;
        if (t.includes('kasir') || t.includes('pos')) return UtensilsCrossed;
        if (t.includes('meja') || t.includes('qr')) return QrCode;
        if (t.includes('dapur') || t.includes('kitchen')) return ChefHat;
        if (t.includes('pengguna') || t.includes('user')) return Users;
        return LayoutDashboard;
    };

    const StationIcon = getStationIcon();

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#08090D]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 select-none shadow-xs dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
            {/* Left: Mobile Toggle + Station Icon + Title */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {/* Mobile / Tablet Drawer Toggle Button */}
                {onToggleMobileMenu && (
                    <button
                        type="button"
                        onClick={onToggleMobileMenu}
                        className="lg:hidden w-11 h-11 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center transition-all shrink-0 active:scale-95"
                        title="Buka Menu Navigasi"
                        aria-label="Buka Menu Navigasi"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Station Icon Container */}
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-[#1E1B4B] dark:bg-gradient-to-br dark:from-[#4338CA]/40 dark:to-[#1E1B4B] dark:border-indigo-400/25 dark:text-indigo-300 flex items-center justify-center shadow-xs shrink-0">
                    <StationIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-200" />
                </div>

                {/* Page Title */}
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                        {title}
                    </h1>
                </div>
            </div>

            {/* Center: Search Box (Clean, high contrast, quick-clear) */}
            {showSearch && (
                <div className="relative flex-1 hidden md:block max-w-xs lg:max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        id="navbar-quick-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            if (setSearchQuery) setSearchQuery(e.target.value);
                            if (onQuickSearch) onQuickSearch(e.target.value);
                        }}
                        placeholder={searchPlaceholder}
                        className="w-full h-10 bg-slate-50 dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] focus:border-indigo-500 rounded-xl pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                            title="Hapus pencarian"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Right: Actions, Live Clock, Staff Avatar (No redundant pill boxes!) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                {/* Live Real-Time Clock (Clean text, no pill container) */}
                {currentTime && (
                    <div
                        className="hidden sm:flex flex-col items-end text-right"
                        title={`Tanggal Operasional: ${currentDate}`}
                    >
                        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums leading-none">
                            {currentTime}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-none">
                            {currentDate}
                        </div>
                    </div>
                )}

                {/* Subtle Divider between Clock & Actions */}
                {currentTime && (actions || user) && (
                    <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/[0.08]" />
                )}

                {/* Page Specific Actions Slot (PDF / Excel / Custom) */}
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}

                {/* Dark / Light / System Theme Switcher */}
                <ThemeToggle />

                {/* Staff Avatar (Clean, minimal, no bulky pill wrapper) */}
                {user && (
                    <div
                        className="flex items-center gap-2.5 pl-1"
                        title={`Masuk sebagai: ${user.full_name || 'Staff'} (${user.role?.toUpperCase() || 'KASIR'})`}
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#312E81] to-[#1E1B4B] border border-indigo-400/30 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                            {user.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div className="hidden xl:block text-left min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate leading-tight">
                                {user.full_name || 'Staff'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight mt-0.5">
                                {user.role || 'kasir'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
