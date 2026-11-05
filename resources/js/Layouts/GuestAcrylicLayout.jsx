import React from 'react';
import { Store } from 'lucide-react';
import ToastContainer from '@/Components/Notification/ToastContainer';

/**
 * GuestAcrylicLayout: Layout for unauthenticated visitors (Login, Public Errors).
 * Obsidian Carbon canvas (#07080D) with centered radial spotlight.
 */
export default function GuestAcrylicLayout({ children, title = null, centered = true, fullScreen = false }) {
    if (fullScreen) {
        return (
            <div className="relative min-h-screen bg-[#07080D] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 antialiased overflow-x-hidden">
                <ToastContainer />
                {children}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#06070A] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 antialiased overflow-x-hidden">
            <ToastContainer />
            {/* Ambient Radial Spotlight */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(49, 46, 129, 0.14), transparent 70%)',
                }}
            />

            {/* Minimal Brand Top Header */}
            <header className="relative z-10 h-16 border-b border-white/[0.06] bg-[#08090D] px-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
                        <Store className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="font-semibold text-xs tracking-wider text-slate-100 uppercase block">
                            KASIR & POS SYSTEM
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                            Canteen & QR Table Ordering
                        </span>
                    </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                    Terminal v1.0
                </div>
            </header>

            {/* Main Body */}
            <main className={`relative z-10 flex-1 ${centered ? 'flex items-center justify-center' : 'w-full'} p-4 sm:p-6`}>
                {children}
            </main>
        </div>
    );
}

