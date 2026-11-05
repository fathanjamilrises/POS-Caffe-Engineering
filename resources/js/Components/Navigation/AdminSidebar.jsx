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
} from 'lucide-react';

/**
 * Sidebar collapsed state context — shared between sidebar and layout.
 */
export const SidebarContext = createContext({
    collapsed: false,
    setCollapsed: () => {},
});

export function useSidebar() {
    return useContext(SidebarContext);
}

/**
 * AdminSidebar: Clean collapsible sidebar for staff aged 40–60.
 * - Large touch targets (min 48px height)
 * - Clear Bahasa Indonesia labels, no jargon
 * - Collapse/expand toggle that persists via localStorage
 */
export default function AdminSidebar({ isOpenMobile = false, onCloseMobile = () => {} }) {
    const { auth = {} } = usePage().props;
    const user = auth?.user;
    const { collapsed, setCollapsed } = useSidebar();

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const handleLogout = () => {
        router.post('/logout');
    };

    const allNavLinks = [
        {
            name: 'Beranda',
            description: 'Ringkasan & laporan',
            href: '/admin',
            icon: LayoutDashboard,
            roles: ['admin'],
            exact: true,
        },
        {
            name: 'Produk & Stok',
            description: 'Kelola menu dan harga',
            href: '/admin/products',
            icon: Package,
            roles: ['admin'],
        },
        {
            name: 'Kasir',
            description: 'Buka layar kasir',
            href: '/pos',
            icon: UtensilsCrossed,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Meja & QR',
            description: 'Kelola meja pelanggan',
            href: '/tables',
            icon: QrCode,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Dapur',
            description: 'Layar tampilan dapur',
            href: '/kitchen',
            icon: ChefHat,
            roles: ['admin', 'dapur'],
        },
        {
            name: 'Pengguna',
            description: 'Kelola akun staff',
            href: '/admin/users',
            icon: Users,
            roles: ['admin'],
        },
    ];

    const navLinks = allNavLinks.filter((link) => {
        if (!user) return true;
        if (user.role === 'admin') return true;
        return link.roles.includes(user.role);
    });

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-white/[0.06] bg-[#08090D] h-screen select-none transition-all duration-200 ease-in-out ${sidebarWidth} ${
                    isOpenMobile ? 'translate-x-0 z-50 w-64' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* Header: Logo + Collapse Toggle */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/20 shrink-0">
                            <Store className="w-[18px] h-[18px] text-white" />
                        </div>
                        {!collapsed && (
                            <span className="text-sm font-semibold text-slate-100 truncate">
                                Kasir App
                            </span>
                        )}
                    </div>

                    {/* Desktop: collapse toggle | Mobile: close */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isOpenMobile) {
                                onCloseMobile();
                            } else {
                                setCollapsed(!collapsed);
                            }
                        }}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
                        title={collapsed ? 'Perbesar menu' : 'Perkecil menu'}
                    >
                        {isOpenMobile ? (
                            <X className="w-5 h-5" />
                        ) : collapsed ? (
                            <PanelLeftOpen className="w-5 h-5" />
                        ) : (
                            <PanelLeftClose className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = link.exact
                            ? currentPath === link.href
                            : currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={onCloseMobile}
                                title={collapsed ? link.name : undefined}
                                className={`flex items-center gap-3 rounded-lg transition-colors duration-100 ${
                                    collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'
                                } ${
                                    isActive
                                        ? 'bg-indigo-500/[0.1] text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                <Icon
                                    className={`w-5 h-5 shrink-0 ${
                                        isActive ? 'text-indigo-400' : ''
                                    }`}
                                />
                                {!collapsed && (
                                    <div className="min-w-0">
                                        <div className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                            {link.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate">
                                            {link.description}
                                        </div>
                                    </div>
                                )}
                                {/* Active indicator bar */}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1 h-5 rounded-full bg-indigo-400 shrink-0" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer: User & Logout */}
                <div className="p-2.5 border-t border-white/[0.06] shrink-0">
                    {collapsed ? (
                        /* Collapsed: avatar only + logout below */
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className="w-9 h-9 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-200"
                                title={user?.full_name || 'User'}
                            >
                                {user?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                title="Keluar"
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* Expanded: full user info row */
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                            <div className="w-9 h-9 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                                {user?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-200 truncate">
                                    {user?.full_name || 'Administrator'}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">
                                    {user?.role || 'Admin'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                title="Keluar dari akun"
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
