import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import AdminSidebar from '@/Components/Navigation/AdminSidebar';
import AdminNavbar from '@/Components/Navigation/AdminNavbar';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

/**
 * AdminAcrylicLayout: Minimalist, clean executive layout (Linear/Stripe style).
 * Canvas: #06070A with subtle ambient light.
 */
export default function AdminAcrylicLayout({
    children,
    title = 'Admin Dashboard',
    scannerStatus = 'ready',
    lastScannedBarcode = '',
    onQuickSearch = null,
    searchQuery = '',
    setSearchQuery = null,
    extraNavbarActions = null,
    headerRight = null,
}) {
    const { flash = {} } = usePage().props;
    const [toast, setToast] = useState(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Toast listener for flash messages
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

    const customActions = headerRight || extraNavbarActions;

    // Consolidated Export action group in the top header
    const adminActions = (
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                <a href="/admin/export/pdf" target="_blank" rel="noopener noreferrer">
                    <SpecularButton
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        title="Cetak Laporan PDF"
                        className="text-xs text-slate-300 hover:text-white"
                    >
                        <span className="hidden sm:inline">Export PDF</span>
                    </SpecularButton>
                </a>
                <div className="w-px h-3.5 bg-white/[0.08]" />
                <a href="/admin/export/excel?type=orders">
                    <SpecularButton
                        variant="ghost"
                        size="sm"
                        icon={FileSpreadsheet}
                        title="Unduh Data Excel (.csv)"
                        className="text-xs text-slate-300 hover:text-white"
                    >
                        <span className="hidden sm:inline">Export Excel</span>
                    </SpecularButton>
                </a>
            </div>
            {customActions}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-[#06070A] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 antialiased overflow-x-hidden">
            {/* Ambient Radial Light (Restrained Deep Indigo) */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(49, 46, 129, 0.14), transparent 70%)',
                }}
            />

            {/* Notification Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-2xl transition-all duration-200 bg-[#0E1017] border-white/[0.1] text-white">
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium">{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-white text-xs ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Fixed Sidebar Navigation */}
            <AdminSidebar
                isOpenMobile={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content Area - with lg:pl-64 offset for the fixed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative">
                {/* Unified Admin Navbar Component */}
                <AdminNavbar
                    title={title}
                    scannerStatus={scannerStatus}
                    lastScannedBarcode={lastScannedBarcode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onQuickSearch={onQuickSearch}
                    actions={adminActions}
                    showSearch={true}
                    onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
                />

                {/* Page Content Body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
