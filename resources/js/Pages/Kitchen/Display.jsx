import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Flame,
    Clock,
    CheckCircle2,
    Volume2,
    VolumeX,
    Filter,
    RefreshCw,
    ChefHat,
    AlertTriangle,
    Check,
    ArrowRight,
    Utensils,
    QrCode,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { useAudioAlert } from '@/Hooks/useAudioAlert';

export default function KitchenDisplay({ tickets = [], unnotified_count = 0 }) {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'waiting' | 'cooking' | 'delivered_to_cashier'
    const [now, setNow] = useState(Date.now());
    const [audioMuted, setAudioMuted] = useState(false);

    const { playChime } = useAudioAlert();

    // 1-second interval to update live elapsed timers
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 6-second polling interval to fetch new tickets from kitchen queue
    useEffect(() => {
        const poll = setInterval(() => {
            router.reload({ only: ['tickets', 'unnotified_count'] });
        }, 6000);
        return () => clearInterval(poll);
    }, []);

    // Trigger audio chime when new unnotified tickets arrive
    useEffect(() => {
        if (unnotified_count > 0 && !audioMuted) {
            playChime();
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

    // Calculate elapsed minutes and seconds
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

    const counts = useMemo(() => {
        return {
            all: tickets.length,
            waiting: tickets.filter((t) => t.ticket_status === 'waiting').length,
            cooking: tickets.filter((t) => t.ticket_status === 'cooking').length,
            delivered: tickets.filter((t) => t.ticket_status === 'delivered_to_cashier').length,
        };
    }, [tickets]);

    return (
        <AuthenticatedLayout
            title="Kitchen Display System (KDS)"
            headerRight={
                <div className="flex items-center gap-2">
                    {unnotified_count > 0 && (
                        <SpecularButton
                            variant="primary"
                            size="sm"
                            icon={Volume2}
                            onClick={handleAcknowledgeAudio}
                            className="animate-pulse"
                        >
                            <span>Heningkan Bell ({unnotified_count} Baru)</span>
                        </SpecularButton>
                    )}
                    <button
                        type="button"
                        onClick={() => setAudioMuted(!audioMuted)}
                        className={`p-2 rounded-lg border text-xs transition-colors ${
                            audioMuted
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
                        }`}
                        title={audioMuted ? 'Suara Bell Dinonaktifkan' : 'Suara Bell Aktif'}
                    >
                        {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <SpecularButton
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => router.reload({ only: ['tickets', 'unnotified_count'] })}
                    >
                        <span className="hidden sm:inline">Refresh</span>
                    </SpecularButton>
                </div>
            }
        >
            <Head title="Dapur KDS - Kitchen Display System" />

            {/* Filter Tabs & Counters */}
            <div className="flex items-center justify-between gap-4 flex-wrap select-none border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                        { id: 'all', label: 'Semua Antrean', count: counts.all },
                        { id: 'waiting', label: 'Menunggu Dimasak', count: counts.waiting },
                        { id: 'cooking', label: 'Sedang Dimasak', count: counts.cooking },
                        { id: 'delivered_to_cashier', label: 'Diantar ke Kasir', count: counts.delivered },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-white/[0.07] text-white border border-white/[0.12]'
                                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                                    statusFilter === tab.id
                                        ? 'bg-white/10 text-white'
                                        : 'bg-white/[0.04] text-slate-400'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Auto-sync KDS: 6 detik</span>
                </div>
            </div>

            {/* KDS Large Screen Grid (Readable from 2 meters away) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTickets.length === 0 ? (
                    <div className="col-span-full py-24 text-center text-slate-500 bg-[#0B0D13] rounded-xl border border-white/[0.06]">
                        <ChefHat className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-40" />
                        <h3 className="text-sm font-semibold text-slate-300">
                            Semua Pesanan Dapur Selesai
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Tiket baru dari kasir atau pemesanan QR meja akan otomatis muncul di sini.
                        </p>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => {
                        const elapsed = getElapsedTime(ticket.sent_to_kds_at);
                        const isWaiting = ticket.ticket_status === 'waiting';
                        const isCooking = ticket.ticket_status === 'cooking';
                        const isDelivered = ticket.ticket_status === 'delivered_to_cashier';

                        return (
                            <div
                                key={ticket.id}
                                className={`rounded-xl border border-white/[0.06] bg-[#0B0D13] transition-all flex flex-col justify-between overflow-hidden shadow-sm relative ${
                                    isWaiting
                                        ? 'border-t-2 border-t-rose-500'
                                        : isCooking
                                        ? 'border-t-2 border-t-amber-400'
                                        : 'border-t-2 border-t-emerald-400'
                                }`}
                            >
                                {/* Ticket Header */}
                                <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-white/[0.01]">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-100">
                                                #{ticket.token_number}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400">
                                                {ticket.order?.table
                                                    ? ticket.order.table.table_number
                                                    : 'Takeaway'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            {ticket.order?.invoice_number || 'INV-POS'}
                                        </div>
                                    </div>

                                    {/* Live Elapsed Counter Badge */}
                                    <div
                                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 tabular-nums ${
                                            elapsed.isUrgent
                                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                                                : elapsed.isWarning
                                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                : 'bg-white/[0.04] text-slate-300 border border-white/[0.06]'
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{elapsed.text}</span>
                                    </div>
                                </div>

                                {/* Order Item Details */}
                                <div className="p-4 space-y-3 flex-1">
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-bold font-mono text-slate-200 flex-shrink-0">
                                            {ticket.order_item?.quantity}x
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-semibold text-slate-200 tracking-wide">
                                                {ticket.order_item?.product?.product_name || 'Menu Dapur'}
                                            </h4>
                                            <div className="text-[11px] text-slate-400">
                                                {ticket.order_item?.product?.category?.category_name || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes / Special Instructions */}
                                    {ticket.order_item?.notes && (
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                                            <strong className="block text-[10px] uppercase tracking-wider text-amber-400 font-mono">
                                                Catatan Khusus:
                                            </strong>
                                            <span>{ticket.order_item.notes}</span>
                                        </div>
                                    )}

                                    {/* Status Indicator */}
                                    <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-400">
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                isWaiting ? 'bg-rose-500' : isCooking ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}
                                        />
                                        <span>
                                            {isWaiting && 'Menunggu Antrean'}
                                            {isCooking && 'Sedang Dimasak'}
                                            {isDelivered && 'Sudah di Kasir'}
                                        </span>
                                    </div>
                                </div>

                                {/* One-Tap Action Progression Button */}
                                <div className="p-3 border-t border-white/[0.06] bg-[#07080B]/60">
                                    {isWaiting && (
                                        <SpecularButton
                                            variant="primary"
                                            size="md"
                                            icon={Flame}
                                            onClick={() => handleUpdateStatus(ticket.id, 'cooking')}
                                            className="w-full text-xs font-semibold"
                                        >
                                            Mulai Masak
                                        </SpecularButton>
                                    )}

                                    {isCooking && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpdateStatus(ticket.id, 'delivered_to_cashier')
                                            }
                                            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs shadow-sm border border-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Selesai Masak &rarr; Antar ke Kasir</span>
                                        </button>
                                    )}

                                    {isDelivered && (
                                        <div className="text-center py-1 text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Menunggu Konfirmasi Kasir</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </AuthenticatedLayout>
    );
}

