import React from 'react';
import { Search, Menu } from 'lucide-react';

/**
 * AdminNavbar: Clean top bar with title, search, and action slot.
 * Sized for readability — 14px base text, generous padding.
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
}) {
    return (
        <header className="h-16 border-b border-white/[0.06] bg-[#08090D]/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
            {/* Left: Mobile Toggle + Title + Search */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 max-w-2xl">
                {/* Mobile hamburger */}
                {onToggleMobileMenu && (
                    <button
                        type="button"
                        onClick={onToggleMobileMenu}
                        className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
                        title="Buka Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Page Title */}
                <h1 className="text-sm font-semibold text-slate-100 tracking-tight truncate shrink-0">
                    {title}
                </h1>

                {/* Search */}
                {showSearch && (
                    <div className="relative flex-1 hidden md:block max-w-sm">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            id="navbar-quick-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                if (setSearchQuery) setSearchQuery(e.target.value);
                                if (onQuickSearch) onQuickSearch(e.target.value);
                            }}
                            placeholder={searchPlaceholder}
                            className="w-full bg-[#0C0E16] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </header>
    );
}
