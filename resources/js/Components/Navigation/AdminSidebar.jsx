import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    UtensilsCrossed,
    ChefHat,
    QrCode,
    Store,
    LogOut,
    X,
    Package,
    Users,
    PanelLeftClose,
    PanelLeftOpen,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';

/**
 * Sidebar collapsed state context — shared between sidebar and layouts.
 */
export const SidebarContext = createContext({
    collapsed: false,
    setCollapsed: () => {},
});

export function useSidebar() {
    return useContext(SidebarContext);
}

/**
 * AdminSidebar: Tablet-first, high-ergonomics navigation sidebar.
 * Specifically tuned for cafe/canteen staff aged 40–60 using tablet POS devices:
 * - Minimum 52px touch target height for finger/stylus tapping.
 * - Clean Obsidian Ultramarine & Tanzanite palette without decorative pill clutter (anti-slop).
 * - Buttery-smooth collapse/expand transition (300ms ease-in-out) with text cross-fade.
 * - Perfectly centered logo button when collapsed (never overlapped or covered).
 * - Tablet kiosk fullscreen mode toggle to eliminate browser distractions.
 * - Safe logout confirmation modal (prevents accidental mis-taps on touchscreen).
 */
export default function AdminSidebar({ isOpenMobile = false, onCloseMobile = () => {} }) {
    const { auth = {} } = usePage().props;
    const user = auth?.user;
    const { collapsed, setCollapsed } = useSidebar();

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // Fullscreen Kiosk Mode for Tablet
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        }
    };

    // Logout Confirmation Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        router.post('/logout');
    };

    // Navigation Groups strictly separated by role
    const userRole = user?.role || 'admin';

    const getNavGroups = () => {
        if (userRole === 'admin') {
            return [
                {
                    title: 'Menu Administrasi',
                    links: [
                        {
                            name: 'Beranda',
                            description: 'Ringkasan & Pendapatan',
                            href: '/admin',
                            icon: LayoutDashboard,
                            exact: true,
                        },
                        {
                            name: 'Produk & Stok',
                            description: 'Katalog Menu & Sisa Stok',
                            href: '/admin/products',
                            icon: Package,
                        },
                        {
                            name: 'Meja & QR',
                            description: 'Status Meja & QR',
                            href: '/tables',
                            icon: QrCode,
                        },
                        {
                            name: 'Pengguna',
                            description: 'Kelola Akun & Staff',
                            href: '/admin/users',
                            icon: Users,
                        },
                    ],
                },
            ];
        }

        if (userRole === 'kasir') {
            return [
                {
                    title: 'Operasional Kasir',
                    links: [
                        {
                            name: 'Kasir POS',
                            description: 'Transaksi & Pembayaran',
                            href: '/pos',
                            icon: UtensilsCrossed,
                        },
                        {
                            name: 'Meja & QR',
                            description: 'Status Meja & QR',
                            href: '/tables',
                            icon: QrCode,
                        },
                    ],
                },
            ];
        }

        if (userRole === 'dapur') {
            return [
                {
                    title: 'Operasional Dapur',
                    links: [
                        {
                            name: 'Dapur (KDS)',
                            description: 'Monitor Antrean Masakan',
                            href: '/kitchen',
                            icon: ChefHat,
                        },
                    ],
                },
            ];
        }

        return [];
    };

    const navGroups = getNavGroups();

    const sidebarWidth = collapsed ? 'w-20' : 'w-72';

    return (
        <>
            {/* Mobile / Tablet Portrait Backdrop */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Shell */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-white/[0.08] bg-[#08090D] h-screen select-none transition-all duration-300 ease-in-out overflow-hidden ${sidebarWidth} ${
                    isOpenMobile ? 'translate-x-0 z-50 w-72' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* 1. Header: Store Logo, Title & Always-Visible Open/Close Toggle */}
                <div className="h-16 px-3.5 flex items-center justify-between border-b border-white/[0.08] shrink-0 bg-[#0A0C13] overflow-hidden">
                    {/* Left: Logo & Store Title (Cleanly hides/covers when collapsed) */}
                    <div
                        className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ease-in-out ${
                            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100 flex-1 min-w-0'
                        }`}
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4338CA] via-[#3730A3] to-[#1E1B4B] flex items-center justify-center border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shrink-0">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        <div className="overflow-hidden whitespace-nowrap min-w-0">
                            <div className="text-sm font-bold text-slate-100 tracking-tight leading-tight truncate">
                                KASIR CAFE
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium truncate">
                                Sistem POS Tablet
                            </div>
                        </div>
                    </div>

                    {/* Open/Close Toggle Button (ALWAYS PRESENT & VISIBLE!) */}
                    <div
                        className={`flex items-center transition-all duration-300 ease-in-out shrink-0 ${
                            collapsed ? 'w-full justify-center' : ''
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (isOpenMobile) {
                                    onCloseMobile();
                                } else {
                                    setCollapsed(!collapsed);
                                }
                            }}
                            className={`rounded-xl text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] flex items-center justify-center transition-all active:scale-95 ${
                                collapsed ? 'w-11 h-11' : 'w-9 h-9'
                            }`}
                            title={collapsed ? 'Buka panel menu (Perbesar)' : 'Tutup panel menu (Perkecil)'}
                            aria-label={collapsed ? 'Buka panel menu' : 'Tutup panel menu'}
                        >
                            {isOpenMobile ? (
                                <X className="w-5 h-5" />
                            ) : collapsed ? (
                                <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
                            ) : (
                                <PanelLeftClose className="w-5 h-5 text-slate-400" />
                            )}
                        </button>
                    </div>
                </div>

            {/* 2. Navigation Links List */}
            <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
                {navGroups.map((group, groupIdx) => (
                    <div key={group.title || groupIdx}>
                        {groupIdx > 0 && collapsed ? (
                            <div className="border-t border-white/[0.06] my-2 mx-3" />
                        ) : (
                            <div
                                className={`px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                                    collapsed ? 'max-w-0 opacity-0 h-0 mb-0' : 'max-w-[200px] opacity-100 h-auto'
                                }`}
                            >
                                {group.title}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            {group.links.map((link) => {
                                const Icon = link.icon;
                                const isActive = link.exact
                                    ? currentPath === link.href
                                    : currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));

                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={onCloseMobile}
                                        title={collapsed ? `${link.name} — ${link.description}` : undefined}
                                        className={`group relative flex items-center h-[52px] min-h-[52px] rounded-xl transition-all duration-300 ease-in-out active:scale-[0.98] ${
                                            collapsed ? 'px-0 justify-center w-12 mx-auto' : 'px-3 gap-3 w-full'
                                        } ${
                                            isActive
                                                ? 'bg-gradient-to-r from-indigo-950/70 via-indigo-900/40 to-indigo-950/20 text-white border border-indigo-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                                                : 'bg-[#0C0E16]/40 hover:bg-[#141824] text-slate-300 hover:text-white border border-white/[0.04] hover:border-white/[0.08]'
                                        }`}
                                    >
                                        {/* Icon Badge */}
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                isActive
                                                    ? 'bg-gradient-to-br from-[#4338CA] to-[#312E81] text-white border border-indigo-400/40 shadow-sm'
                                                    : 'bg-white/[0.03] border border-white/[0.05] text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        {/* Label & Description (Smoothly collapses width and fades out) */}
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap min-w-0 ${
                                                collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[180px] opacity-100 flex-1'
                                            }`}
                                        >
                                            <div
                                                className={`text-sm truncate ${
                                                    isActive ? 'font-bold text-white' : 'font-semibold text-slate-200 group-hover:text-white'
                                                }`}
                                            >
                                                {link.name}
                                            </div>
                                            <div
                                                className={`text-xs truncate mt-0.5 ${
                                                    isActive ? 'text-indigo-200/90 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                                                }`}
                                            >
                                                {link.description}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* 3. Tablet Utility Tool: Clean Fullscreen Toggle (No decorative pill badges) */}
            <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className={`flex items-center h-[46px] rounded-xl bg-[#0C0E16] hover:bg-[#151824] border border-white/[0.06] text-slate-300 hover:text-white transition-all duration-300 ease-in-out active:scale-[0.98] ${
                        collapsed ? 'w-12 px-0 justify-center mx-auto' : 'w-full px-3 gap-2.5'
                    }`}
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Tablet'}
                >
                    {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    ) : (
                        <Maximize2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    )}
                    <span
                        className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out truncate ${
                            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[180px] opacity-100 flex-1 text-left'
                        }`}
                    >
                        {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Tablet'}
                    </span>
                </button>
            </div>

            {/* 4. Footer: Staff Profile & Safe Logout Button */}
            <div className="p-3 border-t border-white/[0.08] bg-[#0A0C13] shrink-0">
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#312E81] to-[#1E1B4B] border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-200"
                            title={`${user?.full_name || (user?.role === 'admin' ? 'Administrator' : 'Staff')} (${user?.role?.toUpperCase() || 'PENGGUNA'})`}
                        >
                            {user?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            title="Keluar dari akun"
                            className="w-11 h-11 rounded-xl bg-white/[0.02] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 flex items-center justify-center transition-colors active:scale-95"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0C0E16] border border-white/[0.06]">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#312E81] to-[#1E1B4B] border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                            {user?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-100 truncate">
                                {user?.full_name || (user?.role === 'admin' ? 'Administrator' : 'Staff Operasional')}
                            </div>
                            <div className="text-xs text-slate-400 capitalize mt-0.5 truncate">
                                {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'kasir' ? 'Staff Kasir' : user?.role === 'dapur' ? 'Staff Dapur' : user?.role}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            title="Keluar dari akun"
                            className="w-9 h-9 rounded-xl bg-white/[0.02] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 flex items-center justify-center transition-colors shrink-0 active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>

        {/* Logout Confirmation Dialog (Accessible Modal) */}
        <AcrylicModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            title="Konfirmasi Keluar Sesi"
            subtitle="Pastikan seluruh pekerjaan atau transaksi berjalan telah disimpan sebelum mengakhiri sesi."
            maxWidth="max-w-md"
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(false)}
                        className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors min-h-[44px]"
                    >
                        Batal, Tetap di Halaman
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmLogout}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/40 rounded-xl transition-all shadow-sm min-h-[44px] flex items-center gap-2 active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Ya, Keluar Sesi</span>
                    </button>
                </div>
            }
        >
            <div className="py-2 text-sm text-slate-300 space-y-2.5">
                <p>
                    Anda sedang aktif sebagai{' '}
                    <strong className="text-white font-semibold">
                        {user?.full_name || 'Staff'}
                    </strong>{' '}
                    dengan hak akses{' '}
                    <span className="font-mono text-indigo-300 uppercase font-semibold">
                        {user?.role || 'PENGGUNA'}
                    </span>
                    .
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Sesi Anda pada sistem ini akan ditutup dan Anda akan dialihkan kembali ke halaman masuk (login).
                </p>
            </div>
        </AcrylicModal>
    </>
    );
}
