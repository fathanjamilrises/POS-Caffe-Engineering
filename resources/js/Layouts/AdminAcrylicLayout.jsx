import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import AdminSidebar, { SidebarContext } from '@/Components/Navigation/AdminSidebar';
import AdminNavbar from '@/Components/Navigation/AdminNavbar';
import ToastContainer from '@/Components/Notification/ToastContainer';

/**
 * AdminAcrylicLayout: Main authenticated layout with collapsible sidebar.
 * Designed for cafe/canteen staff aged 40–60:
 *  - Large text, generous spacing
 *  - Sidebar remembers collapsed state via localStorage
 *  - Clean transitions, no decorative elements
 */
export default function AdminAcrylicLayout({
    children,
    title = 'Beranda',
    scannerStatus = 'ready',
    lastScannedBarcode = '',
    onQuickSearch = null,
    searchQuery = '',
    setSearchQuery = null,
    extraNavbarActions = null,
    headerRight = null,
    showSearch = false,
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sidebar collapse state — persisted to localStorage
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(collapsed));
    }, [collapsed]);

    const customActions = headerRight || extraNavbarActions;

    // Export buttons
    const adminActions = (
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
                <a href="/admin/export/pdf" target="_blank" rel="noopener noreferrer">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:border-white/[0.08] rounded-xl transition-colors shadow-xs dark:shadow-none"
                    >
                        <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        <span>PDF</span>
                    </button>
                </a>
                <a href="/admin/export/excel?type=orders">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:border-white/[0.08] rounded-xl transition-colors shadow-xs dark:shadow-none"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Excel</span>
                    </button>
                </a>
            </div>
            {customActions}
        </div>
    );

    // Sidebar width offset for main content
    const sidebarOffset = collapsed ? 'lg:pl-20' : 'lg:pl-72';

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#07080D] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased overflow-x-clip">
                {/* Dynamic Non-blocking Push Notification Alert Stack */}
                <ToastContainer />

                {/* Sidebar */}
                <AdminSidebar
                    isOpenMobile={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarOffset} relative`}>
                    <AdminNavbar
                        title={title}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onQuickSearch={onQuickSearch}
                        actions={adminActions}
                        showSearch={showSearch}
                        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
                    />

                    {/* Page Body */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
