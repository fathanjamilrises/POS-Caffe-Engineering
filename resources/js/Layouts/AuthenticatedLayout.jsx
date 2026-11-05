import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import AdminSidebar, { SidebarContext } from '@/Components/Navigation/AdminSidebar';
import AdminNavbar from '@/Components/Navigation/AdminNavbar';

/**
 * AuthenticatedLayout: Unified layout for logged-in users (POS, KDS, Tables).
 * Features a collapsible docked sidebar and sticky navbar.
 * Designed for cafe/canteen staff aged 40–60: high contrast, generous touch targets.
 */
export default function AuthenticatedLayout({
    children,
    title = 'Kasir POS',
    scannerStatus = 'ready',
    lastScannedBarcode = '',
    headerRight = null,
    searchQuery = '',
    setSearchQuery = null,
    onQuickSearch = null,
    showSearch = false,
}) {
    const { flash = {} } = usePage().props;
    const [toast, setToast] = useState(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sidebar collapse state — persisted to localStorage
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(collapsed));
    }, [collapsed]);

    // Toast for flash messages
    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', message: flash.success });
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ type: 'error', message: flash.error });
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Sidebar width offset for main content
    const sidebarOffset = collapsed ? 'lg:pl-[72px]' : 'lg:pl-64';

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div className="relative min-h-screen bg-[#07080D] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
                {/* Notification Toast */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border bg-[#0E1017] border-white/[0.1] text-white shadow-xl max-w-sm">
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="text-slate-400 hover:text-white ml-2 text-sm"
                            aria-label="Tutup notifikasi"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Collapsible Fixed Sidebar Navigation */}
                <AdminSidebar
                    isOpenMobile={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-w-0 ${sidebarOffset} relative transition-all duration-200`}>
                    {/* Unified Top Navbar Component */}
                    <AdminNavbar
                        title={title}
                        scannerStatus={scannerStatus}
                        lastScannedBarcode={lastScannedBarcode}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onQuickSearch={onQuickSearch}
                        actions={headerRight}
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
