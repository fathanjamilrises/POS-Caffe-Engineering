import React from 'react';
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
} from 'lucide-react';

/**
 * AdminSidebar: Clean, minimalist, executive sidebar navigation (Linear/Stripe style).
 * Fixed to the viewport edge, with clean typography, monochrome icons, and no decorative badge noise.
 */
export default function AdminSidebar({ isOpenMobile = false, onCloseMobile = () => {} }) {
    const { auth = {} } = usePage().props;
    const user = auth?.user;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const handleLogout = () => {
        router.post('/logout');
    };

    const allNavLinks = [
        {
            name: 'Dashboard & Laporan',
            href: '/admin',
            icon: LayoutDashboard,
            roles: ['admin'],
            exact: true,
        },
        {
            name: 'Kelola Produk & Stok',
            href: '/admin/products',
            icon: Package,
            roles: ['admin'],
        },
        {
            name: 'Kasir POS (Direct)',
            href: '/pos',
            icon: UtensilsCrossed,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Meja & QR Ordering',
            href: '/tables',
            icon: QrCode,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Dapur KDS Display',
            href: '/kitchen',
            icon: ChefHat,
            roles: ['admin', 'dapur'],
        },
        {
            name: 'Kelola Pengguna',
            href: '/admin/users',
            icon: Users,
            roles: ['admin'],
        },
    ];

    // Filter links based on user role (Admin sees all links)
    const navLinks = allNavLinks.filter((link) => {
        if (!user) return true;
        if (user.role === 'admin') return true;
        return link.roles.includes(user.role);
    });

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            )}

            {/* Fixed Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col border-r border-white/[0.06] bg-[#08090D] h-screen select-none transition-transform duration-150 lg:translate-x-0 ${
                    isOpenMobile ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* Brand Header */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0 bg-[#08090D]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
                            <Store className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-semibold text-xs tracking-wider text-slate-100 uppercase block">
                                KASIR APP
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                                Management Suite
                            </span>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
                        title="Tutup Menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    <div className="px-2.5 pb-2 text-[10px] font-mono tracking-wider uppercase text-slate-500 font-medium">
                        Menu Utama
                    </div>
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
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors duration-100 ${
                                    isActive
                                        ? 'bg-white/[0.04] text-white border-l-2 border-indigo-400 font-medium'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                                }`}
                            >
                                <Icon
                                    className={`w-4 h-4 flex-shrink-0 ${
                                        isActive ? 'text-indigo-400' : 'text-slate-400'
                                    }`}
                                />
                                <span className="truncate">{link.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile & Logout in Sidebar Footer ONLY */}
                <div className="p-3 border-t border-white/[0.06] bg-[#07080B] flex-shrink-0">
                    <div className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-indigo-950/60 border border-indigo-500/25 flex items-center justify-center text-[10px] font-bold text-indigo-200 flex-shrink-0 font-mono">
                                {user?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-200 truncate">
                                    {user?.full_name || 'Administrator'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono capitalize">
                                    {user?.role || 'Admin'}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Keluar / Logout"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] rounded transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
