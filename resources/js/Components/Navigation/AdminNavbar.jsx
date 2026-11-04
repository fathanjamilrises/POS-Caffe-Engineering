import React, { useEffect } from 'react';
import {
    Barcode,
    Search,
    Menu,
} from 'lucide-react';

/**
 * AdminNavbar: Minimalist top header bar (Linear/Raycast style).
 * Focused solely on breadcrumb title, quick search (Ctrl+K), and consolidated action group.
 * User profile is kept exclusively in the bottom-left sidebar.
 */
export default function AdminNavbar({
    title = 'Dashboard',
    scannerStatus = 'ready',
    lastScannedBarcode = '',
    searchQuery = '',
    setSearchQuery = null,
    onQuickSearch = null,
    searchPlaceholder = 'Cari menu (Ctrl+K)...',
    showSearch = true,
    actions = null,
    onToggleMobileMenu = null,
}) {
    // Keyboard shortcut Ctrl+K / Cmd+K to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('navbar-quick-search');
                if (searchInput) searchInput.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header className="h-16 border-b border-white/[0.06] bg-[#08090D]/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
            {/* Left: Mobile Toggle + Title + Barcode Status + Quick Search */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 max-w-2xl">
                {/* Mobile Menu Button */}
                {onToggleMobileMenu && (
                    <button
                        type="button"
                        onClick={onToggleMobileMenu}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors flex-shrink-0"
                        title="Buka Menu Navigasi"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}

                {/* Title */}
                <h1 className="text-sm font-medium text-slate-100 tracking-tight truncate flex-shrink-0">
                    {title}
                </h1>

                {/* Hardware Barcode Scanner Status Indicator - Minimal */}
                <div
                    className={`hidden xl:inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono select-none transition-colors border ${
                        scannerStatus === 'scanning'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : scannerStatus === 'success'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/[0.02] text-slate-400 border-white/[0.06]'
                    }`}
                    title="Hardware Barcode Scanner Listener"
                >
                    <Barcode className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {scannerStatus === 'scanning' && 'Scan...'}
                        {scannerStatus === 'success' && (lastScannedBarcode || 'OK')}
                        {scannerStatus === 'ready' && 'Ready'}
                    </span>
                </div>

                {/* Quick Search Input */}
                {showSearch && (
                    <div className="relative flex-1 hidden md:block max-w-md">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            id="navbar-quick-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                if (setSearchQuery) setSearchQuery(e.target.value);
                                if (onQuickSearch) onQuickSearch(e.target.value);
                            }}
                            placeholder={searchPlaceholder}
                            className="w-full bg-[#0B0D13] border border-white/[0.07] rounded-lg pl-8 pr-12 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50 transition-colors shadow-[inset_0_1px_0_0_rgba(0,0,0,0.5)]"
                        />
                        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-500 bg-white/[0.04] border border-white/[0.06] rounded absolute right-2 top-1/2 -translate-y-1/2 select-none">
                            Ctrl+K
                        </kbd>
                    </div>
                )}
            </div>

            {/* Right: Consolidated Action Group (e.g. Export buttons, etc.) */}
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </header>
    );
}
