import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import AdminSidebar from '@/Components/Navigation/AdminSidebar';
import AdminNavbar from '@/Components/Navigation/AdminNavbar';

/**
 * AuthenticatedLayout: Unified Smoked Acrylic layout for logged-in users (POS, KDS, Tables).
 * Features a fixed docked sidebar (fixed inset-y-0 left-0) and sticky navbar with seamless page scrolling.
 */
export default function AuthenticatedLayout({
    children,
    title = 'POS System',
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

    return (
        <div className="relative min-h-screen bg-[#06070A] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 antialiased overflow-x-hidden">
            {/* Ambient Radial Spotlight (Deep Matte Indigo) */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(49, 46, 129, 0.14), transparent 70%)',
                }}
            />

            {/* Notification Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 bg-[#16192B]/95 border-indigo-400/30 text-white">
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-white text-xs ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Fixed Sidebar Navigation - Firmly docked to left edge */}
            <AdminSidebar
                isOpenMobile={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content Area - with lg:pl-64 offset for the fixed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative">
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
    );
}
