import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Flame,
    Clock,
    CheckCircle2,
    Volume2,
    VolumeX,
    RefreshCw,
    ChefHat,
    AlertTriangle,
    Check,
    Store,
    ShoppingBag,
    Bell,
    Layers,
    User,
    Calendar,
    UtensilsCrossed,
    Maximize2,
    Minimize2,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { useAudioAlert } from '@/Hooks/useAudioAlert';
import { toast } from '@/Services/toast';

/**
 * Kitchen Display System (KDS) - Tablet & Ergonomic Edition
 * Specifically calibrated for kitchen staff aged 40–60:
 * - High visual hierarchy legible from 1.5 – 2 meters away.
 * - Minimum 52px – 56px touch targets for greasy/wet tablet touch screens.
 * - High-contrast semantic timers (Normal -> Amber -> Urgent Flashing Rose).
 * - Ultra-prominent customer cooking notes to prevent allergen & kitchen errors.
 * - Zero AI-slop decorative pill bars; authentic executive Obsidian Tanzanite styling.
 */
export default function KitchenDisplay({ tickets = [], unnotified_count = 0 }) {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'waiting' | 'cooking' | 'delivered_to_cashier'
    const [now, setNow] = useState(Date.now());
    const [audioMuted, setAudioMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { playChime } = useAudioAlert();

    // Tablet Kiosk Fullscreen Mode Listener
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

    // 1-second interval to update live elapsed timers
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 6-second polling interval to auto-fetch new kitchen tickets
    useEffect(() => {
        const poll = setInterval(() => {
            router.reload({ only: ['tickets', 'unnotified_count'] });
        }, 6000);
        return () => clearInterval(poll);
    }, []);

    // Trigger audio chime & toast alert when new unnotified tickets arrive
    useEffect(() => {
        if (unnotified_count > 0) {
            if (!audioMuted) {
                playChime();
            }
            toast.info(`${unnotified_count} pesanan baru masuk ke antrean koki!`, {
                title: 'Pesanan Dapur Baru',
                duration: 5000,
            });
        }
    }, [unnotified_count, audioMuted, playChime]);

    const handleAcknowledgeAudio = () => {
        router.post('/kitchen/acknowledge-audio', {}, { preserveScroll: true });
    };

    const handleUpdateStatus = (ticketId, nextStatus) => {
        router.post(
            `/kitchen/tickets/${ticketId}/status`,
            { status: nextStatus },
            { preserveScroll: true }
        );
    };

    // Calculate elapsed minutes and seconds with high-contrast warning levels
    const getElapsedTime = (sentAt) => {
        if (!sentAt) return { text: '00:00', minutes: 0, isUrgent: false, isWarning: false };
        const sentTime = new Date(sentAt).getTime();
        const diffSecs = Math.max(0, Math.floor((now - sentTime) / 1000));
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        const text = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        return {
            text,
            minutes: mins,
            isWarning: mins >= 5 && mins < 10,
            isUrgent: mins >= 10,
        };
    };

    // Filter tickets
    const filteredTickets = useMemo(() => {
        if (statusFilter === 'all') return tickets;
        return tickets.filter((t) => t.ticket_status === statusFilter);
    }, [tickets, statusFilter]);

    // Status counts
    const counts = useMemo(() => {
        const waiting = tickets.filter((t) => t.ticket_status === 'waiting').length;
        const cooking = tickets.filter((t) => t.ticket_status === 'cooking').length;
        const delivered = tickets.filter((t) => t.ticket_status === 'delivered_to_cashier').length;
        const urgent = tickets.filter((t) => {
            if (!t.sent_to_kds_at) return false;
            const diffMins = (now - new Date(t.sent_to_kds_at).getTime()) / 60000;
            return diffMins >= 10;
        }).length;

        return {
            all: tickets.length,
            waiting,
            cooking,
            delivered,
            urgent,
        };
    }, [tickets, now]);

    return (
        <AuthenticatedLayout
            title="KDS Dapur - Monitor Pesanan Makanan"
            showSearch={false}
            fullWidth={true}
            mainClassName="flex-1 p-2.5 sm:p-3.5 lg:p-4 w-full flex flex-col min-h-0"
            headerRight={
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Tablet Fullscreen Kiosk Mode Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="min-h-[44px] px-3 rounded-xl bg-[#0C0E16] hover:bg-white/[0.08] active:scale-95 border border-white/[0.08] text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh Tablet'}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="w-4 h-4 text-indigo-400" />
                                <span className="hidden sm:inline">Normal</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4 text-indigo-400" />
                                <span className="hidden sm:inline">Layar Penuh</span>
                            </>
                        )}
                    </button>

                    {/* Audio Alert Control */}
                    {unnotified_count > 0 ? (
                        <button
                            type="button"
                            onClick={handleAcknowledgeAudio}
                            className="min-h-[44px] px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-rose-400/40 shadow-lg shadow-rose-950/50 animate-pulse transition-all"
                            title="Klik untuk matikan suara lonceng dan konfirmasi pesanan masuk"
                        >
                            <Bell className="w-4 h-4 animate-bounce shrink-0" />
                            <span className="truncate">Heningkan ({unnotified_count})</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAudioMuted(!audioMuted)}
                            className={`min-h-[44px] px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                                audioMuted
                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                    : 'bg-[#0C0E16] hover:bg-white/[0.08] border-white/[0.08] text-slate-200'
                            }`}
                            title={audioMuted ? 'Suara bell mati. Klik untuk aktifkan' : 'Suara bell aktif. Klik untuk bisukan'}
                        >
                            {audioMuted ? (
                                <>
                                    <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span className="hidden sm:inline">Bell Mati</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="hidden sm:inline">Bell Aktif</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Manual Refresh */}
                    <button
                        type="button"
                        onClick={() => router.reload({ only: ['tickets', 'unnotified_count'] })}
                        className="min-h-[44px] px-3 sm:px-3.5 rounded-xl bg-[#0C0E16] hover:bg-white/[0.08] active:scale-95 border border-white/[0.08] text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        title="Segarkan data antrean dapur"
                    >
                        <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="hidden sm:inline">Segarkan</span>
                    </button>
                </div>
            }
        >
            <Head title="Monitor Dapur KDS - Stasiun Masak" />

            <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-3.5">
                {/* ============================================================
                    1. TACTILE PIPELINE SWITCHER & STATS BAR (TABLET TOUCH OPTIMIZED)
                    Replaces boring static metrics with interactive 1-tap filter stations.
                    Min height >= 52px for fat-finger / tablet touch accuracy.
                ============================================================ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 select-none shrink-0">
                    {/* Station 1: Semua Tiket */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`min-h-[52px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all active:scale-[0.98] ${
                            statusFilter === 'all'
                                ? 'bg-[#1E1B4B] border-indigo-400/50 shadow-md ring-2 ring-indigo-500/30'
                                : 'bg-[#0C0E16] hover:bg-white/[0.04] border-white/[0.08]'
                        }`}
                    >
                        <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-slate-300 block truncate">
                                Semua Antrean
                            </span>
                            <span className="text-[11px] text-slate-500 hidden sm:block truncate mt-0.5">
                                Seluruh tiket aktif
                            </span>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-lg sm:text-xl font-black font-mono text-white tabular-nums shrink-0">
                            {counts.all}
                        </div>
                    </button>

                    {/* Station 2: Menunggu Dimasak (Rose Alert) */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('waiting')}
                        className={`min-h-[52px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all active:scale-[0.98] ${
                            statusFilter === 'waiting'
                                ? 'bg-rose-950/40 border-rose-500/60 shadow-md ring-2 ring-rose-500/30'
                                : 'bg-[#0C0E16] hover:bg-white/[0.04] border-white/[0.08]'
                        }`}
                    >
                        <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-rose-300 block truncate flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                <span>Menunggu</span>
                            </span>
                            <span className="text-[11px] text-slate-500 hidden sm:block truncate mt-0.5">
                                Belum diolah koki
                            </span>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-lg sm:text-xl font-black font-mono text-rose-300 tabular-nums shrink-0">
                            {counts.waiting}
                        </div>
                    </button>

                    {/* Station 3: Sedang Dimasak (Amber Active) */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('cooking')}
                        className={`min-h-[52px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all active:scale-[0.98] ${
                            statusFilter === 'cooking'
                                ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-[#0C0E16] hover:bg-white/[0.04] border-white/[0.08]'
                        }`}
                    >
                        <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-300 block truncate flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Di Kompor</span>
                            </span>
                            <span className="text-[11px] text-slate-500 hidden sm:block truncate mt-0.5">
                                Sedang dimasak
                            </span>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg sm:text-xl font-black font-mono text-amber-300 tabular-nums shrink-0">
                            {counts.cooking}
                        </div>
                    </button>

                    {/* Station 4: Diantar ke Kasir (Emerald Done) */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('delivered_to_cashier')}
                        className={`min-h-[52px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all active:scale-[0.98] ${
                            statusFilter === 'delivered_to_cashier'
                                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-[#0C0E16] hover:bg-white/[0.04] border-white/[0.08]'
                        }`}
                    >
                        <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-emerald-300 block truncate flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Di Meja Kasir</span>
                            </span>
                            <span className="text-[11px] text-slate-500 hidden sm:block truncate mt-0.5">
                                Siap disajikan
                            </span>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg sm:text-xl font-black font-mono text-emerald-300 tabular-nums shrink-0">
                            {counts.delivered}
                        </div>
                    </button>
                </div>

                {/* ============================================================
                    2. URGENT ALERT BANNER (Only appears if any order >= 10 mins)
                    Direct visual feedback for kitchen manager / head chef.
                ============================================================ */}
                {counts.urgent > 0 && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-rose-950/50 border-2 border-rose-500/60 flex items-center justify-between gap-3 shadow-md animate-pulse shrink-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/30 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                                    Perhatian Dapur: Ada {counts.urgent} Pesanan Melebihi Batas Waktu 10 Menit!
                                </h4>
                                <p className="text-[11px] sm:text-xs text-rose-200 mt-0.5 truncate">
                                    Prioritaskan tiket berbingkai merah menyala agar tamu tidak menunggu terlalu lama.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className="inline-flex h-8 sm:h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs items-center gap-1 shrink-0 active:scale-95"
                        >
                            <span>Lihat Semua</span>
                        </button>
                    </div>
                )}

                {/* ============================================================
                    3. KDS TICKET CARDS GRID (READABLE FROM 2 METERS AWAY)
                    Massive typography, high contrast, tactile physical touch buttons.
                ============================================================ */}
                {filteredTickets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#0C0E16] rounded-2xl border border-white/[0.08] p-6 sm:p-8 space-y-3 shadow-sm min-h-[240px]">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500">
                            <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 opacity-60 text-indigo-300" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            Semua Pesanan Makanan Selesai
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                            Tidak ada antrean tiket makanan yang perlu dimasak untuk filter ini. Setiap tiket baru dari kasir maupun QR meja akan otomatis berdering dan muncul di sini.
                        </p>
                        {statusFilter !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className="mt-1 h-9 sm:h-10 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-indigo-300 border border-indigo-400/30 text-xs font-bold transition-all active:scale-95"
                            >
                                Kembali ke Semua Antrean
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {filteredTickets.map((ticket) => {
                            const elapsed = getElapsedTime(ticket.sent_to_kds_at);
                            const isWaiting = ticket.ticket_status === 'waiting';
                            const isCooking = ticket.ticket_status === 'cooking';
                            const isDelivered = ticket.ticket_status === 'delivered_to_cashier';

                            return (
                                <div
                                    key={ticket.id}
                                    className={`rounded-2xl border bg-[#0C0E16] flex flex-col justify-between overflow-hidden shadow-md transition-all duration-200 relative ${
                                        elapsed.isUrgent
                                            ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/30'
                                            : isWaiting
                                            ? 'border-rose-500/40 hover:border-rose-500/80'
                                            : isCooking
                                            ? 'border-amber-500/40 hover:border-amber-500/80'
                                            : 'border-emerald-500/40'
                                    }`}
                                >
                                    {/* Status Top Strip (Thick 6px Visual Bar) */}
                                    <div
                                        className={`h-2 w-full ${
                                            elapsed.isUrgent
                                                ? 'bg-rose-500 animate-pulse'
                                                : isWaiting
                                                ? 'bg-rose-500'
                                                : isCooking
                                                ? 'bg-amber-400'
                                                : 'bg-emerald-500'
                                        }`}
                                    />

                                    {/* ========================================================
                                        CARD HEADER: MASSIVE TOKEN NUMBER & MEJA/SERVICE BADGE
                                    ======================================================== */}
                                    <div className="p-4 sm:p-4.5 border-b border-white/[0.08] bg-[#08090D] flex items-start justify-between gap-2.5">
                                        <div className="min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white leading-none">
                                                    #{ticket.token_number}
                                                </span>
                                            </div>

                                            {/* Table / Takeaway Pill */}
                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                {ticket.order?.table ? (
                                                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 font-bold text-xs sm:text-sm flex items-center gap-1">
                                                        <Store className="w-3.5 h-3.5 text-indigo-300" />
                                                        <span>Meja {ticket.order.table.table_number}</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold text-xs sm:text-sm flex items-center gap-1">
                                                        <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                                                        <span>Bungkus (Takeaway)</span>
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                                                    {ticket.order?.customer_name || 'Pelanggan'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Elapsed Timer Display (High Contrast, Legible from afar) */}
                                        <div
                                            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-black flex items-center gap-1.5 tabular-nums shrink-0 border ${
                                                elapsed.isUrgent
                                                    ? 'bg-rose-500/30 text-rose-100 border-rose-500 animate-pulse ring-2 ring-rose-500/30'
                                                    : elapsed.isWarning
                                                    ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                                                    : 'bg-white/[0.06] text-slate-200 border-white/[0.1]'
                                            }`}
                                            title="Durasi waktu sejak pesanan dikirim ke dapur"
                                        >
                                            <Clock className="w-4 h-4 shrink-0" />
                                            <span>{elapsed.text}</span>
                                        </div>
                                    </div>

                                    {/* ========================================================
                                        CARD BODY: FOOD ITEM, QUANTITY & PROMINENT COOKING NOTES
                                    ======================================================== */}
                                    <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                                        {/* Food Title & Big Quantity Badge */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-indigo-200 shrink-0 shadow-sm">
                                                {ticket.order_item?.quantity}x
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                                                    {ticket.order_item?.product?.product_name || 'Menu Dapur'}
                                                </h3>
                                                <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                                                    {ticket.order_item?.product?.category?.category_name || 'Menu Masak'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ultra-Prominent Customer Cooking Notes Box */}
                                        {ticket.order_item?.notes && (
                                            <div className="p-3.5 rounded-xl bg-amber-950/40 border-2 border-amber-500/60 text-amber-200 space-y-1 shadow-sm">
                                                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono font-black text-amber-300">
                                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                                    <span>CATATAN KHUSUS TAMU:</span>
                                                </div>
                                                <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                                                    "{ticket.order_item.notes}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Status & Chef Meta Info */}
                                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                        isWaiting
                                                            ? 'bg-rose-500 animate-pulse'
                                                            : isCooking
                                                            ? 'bg-amber-400 animate-pulse'
                                                            : 'bg-emerald-400'
                                                    }`}
                                                />
                                                <span className="font-semibold text-slate-300">
                                                    {isWaiting && 'Menunggu Antrean'}
                                                    {isCooking && (ticket.chef ? `Dimasak: ${ticket.chef.full_name}` : 'Sedang Dimasak')}
                                                    {isDelivered && 'Sudah di Meja Kasir'}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {ticket.order?.invoice_number ? ticket.order.invoice_number.slice(-5) : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ========================================================
                                        CARD FOOTER: HIGH TACTILE KEYCAP ACTION BUTTON (>=52px)
                                    ======================================================== */}
                                    <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#08090D]">
                                        {isWaiting && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus(ticket.id, 'cooking')}
                                                className="w-full min-h-[52px] sm:min-h-[54px] px-4 rounded-xl bg-gradient-to-b from-[#4F46E5] to-[#3730A3] hover:from-[#4338CA] hover:to-[#312E81] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-indigo-950/60 border border-indigo-400/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                                            >
                                                <Flame className="w-5 h-5 text-amber-300 shrink-0" />
                                                <span>MULAI MASAK (KOMPOR)</span>
                                            </button>
                                        )}

                                        {isCooking && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus(ticket.id, 'delivered_to_cashier')}
                                                className="w-full min-h-[52px] sm:min-h-[54px] px-4 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-amber-950/60 border border-amber-400/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]"
                                            >
                                                <Check className="w-6 h-6 stroke-[3] text-white shrink-0" />
                                                <span>SELESAI &rarr; BAWA KE KASIR</span>
                                            </button>
                                        )}

                                        {isDelivered && (
                                            <div className="min-h-[52px] sm:min-h-[54px] px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-mono font-bold text-center">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <span>Di Meja Kasir (Menunggu Serah Terima)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
