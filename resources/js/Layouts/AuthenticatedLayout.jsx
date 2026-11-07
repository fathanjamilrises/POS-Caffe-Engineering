import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import AdminSidebar, { SidebarContext } from '@/Components/Navigation/AdminSidebar';
import AdminNavbar from '@/Components/Navigation/AdminNavbar';
import ToastContainer from '@/Components/Notification/ToastContainer';

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
    fullWidth = false,
    isPosMode = false,
    mainClassName = '',
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

    // Sidebar width offset for main content
    const sidebarOffset = collapsed ? 'lg:pl-20' : 'lg:pl-72';

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div
                className={`relative ${
                    isPosMode ? 'h-screen max-h-screen overflow-hidden overflow-x-hidden' : 'min-h-screen overflow-x-clip'
                } bg-[#F8FAFC] dark:bg-[#07080D] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased`}
            >
                {/* Dynamic Non-blocking Push Notification Alert Stack */}
                <ToastContainer />

                {/* Collapsible Fixed Sidebar Navigation */}
                <AdminSidebar
                    isOpenMobile={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div
                    className={`flex-1 flex flex-col min-w-0 ${
                        isPosMode ? 'h-full max-h-screen overflow-hidden overflow-x-hidden' : ''
                    } ${sidebarOffset} relative transition-all duration-300 ease-in-out`}
                >
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
                    <main
                        className={
                            mainClassName
                                ? mainClassName
                                : isPosMode
                                ? 'flex-1 h-[calc(100vh-64px)] overflow-hidden overflow-x-hidden p-2 sm:p-3 w-full max-w-[1920px] mx-auto flex flex-col min-h-0'
                                : fullWidth
                                ? 'flex-1 p-3 sm:p-4 lg:p-5 space-y-4 w-full mx-auto max-w-[1800px]'
                                : 'flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto'
                        }
                    >
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
