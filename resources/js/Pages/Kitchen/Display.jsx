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
    Utensils,
    Bell,
    Sparkles,
    CheckCircle,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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

    // Calculate elapsed minutes and seconds with ergonomic warning thresholds
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
        return {
            all: tickets.length,
            waiting: tickets.filter((t) => t.ticket_status === 'waiting').length,
            cooking: tickets.filter((t) => t.ticket_status === 'cooking').length,
            delivered: tickets.filter((t) => t.ticket_status === 'delivered_to_cashier').length,
        };
    }, [tickets]);

    // Top Metric Cards (Consistent with Beranda, Produk, & Meja)
    const metricCards = [
        {
            label: 'Total Antrean Dapur',
            value: counts.all,
            subtext: 'Seluruh pesanan makanan aktif',
            icon: ChefHat,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
        },
        {
            label: 'Menunggu Dimasak',
            value: counts.waiting,
            subtext: 'Tiket baru belum diolah',
            icon: Clock,
            iconBg: 'bg-rose-500/10',
            iconColor: 'text-rose-400',
        },
        {
            label: 'Sedang Dimasak',
            value: counts.cooking,
            subtext: 'Sedang di kompor / penggorengan',
            icon: Flame,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-400',
        },
        {
            label: 'Diantar ke Kasir',
            value: counts.delivered,
            subtext: 'Selesai masak, siap disajikan',
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
        },
    ];

    return (
        <AuthenticatedLayout
            title="Kitchen Display System (KDS Dapur)"
            showSearch={false}
            headerRight={
                <div className="flex items-center gap-2.5">
                    {unnotified_count > 0 ? (
                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={Bell}
                            onClick={handleAcknowledgeAudio}
                            className="animate-pulse shadow-md"
                        >
                            <span>Heningkan Bell ({unnotified_count} Baru)</span>
                        </SpecularButton>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAudioMuted(!audioMuted)}
                            className={`min-h-[42px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
                                audioMuted
                                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                    : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
                            }`}
                            title={audioMuted ? 'Aktifkan Suara Bell' : 'Bisukan Suara Bell'}
                        >
                            {audioMuted ? (
                                <>
                                    <VolumeX className="w-4 h-4 text-rose-400" />
                                    <span className="hidden sm:inline">Bell Mati</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-4 h-4 text-emerald-400" />
                                    <span className="hidden sm:inline">Bell Aktif</span>
                                </>
                            )}
                        </button>
                    )}
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        icon={RefreshCw}
                        onClick={() => router.reload({ only: ['tickets', 'unnotified_count'] })}
                    >
                        <span className="hidden sm:inline">Segarkan</span>
                    </SpecularButton>
                </div>
            }
        >
            <Head title="Dapur KDS - Kitchen Display System" />

            <div className="space-y-6">
                {/* ============================================================
                    TOP METRIC CARDS (KONSISTEN DENGAN BERANDA & PRODUK)
                ============================================================ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metricCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 font-medium">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">
                                        {card.value}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {card.subtext}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ============================================================
                    TOOLBAR & FILTER TABS (RAMAH USIA 40-60 TAHUN)
                ============================================================ */}
                <div className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
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
                                className={`min-h-[42px] flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    statusFilter === tab.id
                                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                        : 'bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.07] border border-white/[0.06]'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums ${
                                        statusFilter === tab.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/[0.06] text-slate-400'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Auto-Sync Status Indicator */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-end sm:self-center shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Sinkronisasi Dapur: Otomatis (6 dtk)</span>
                    </div>
                </div>

                {/* ============================================================
                    KDS LARGE SCREEN GRID (TERBACA JELAS DARI JARAK 2 METER)
                ============================================================ */}
                {filteredTickets.length === 0 ? (
                    <div className="py-24 text-center bg-[#0C0E16] rounded-xl border border-white/[0.08] p-8 space-y-3">
                        <ChefHat className="w-16 h-16 mx-auto text-slate-500 opacity-50" />
                        <h3 className="text-lg font-bold text-white">
                            Semua Pesanan Dapur Selesai
                        </h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            Tidak ada antrean tiket makanan yang perlu dimasak saat ini. Tiket baru dari kasir atau pemesanan QR meja akan otomatis muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredTickets.map((ticket) => {
                            const elapsed = getElapsedTime(ticket.sent_to_kds_at);
                            const isWaiting = ticket.ticket_status === 'waiting';
                            const isCooking = ticket.ticket_status === 'cooking';
                            const isDelivered = ticket.ticket_status === 'delivered_to_cashier';

                            return (
                                <div
                                    key={ticket.id}
                                    className={`rounded-xl border bg-[#0C0E16] flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-200 relative ${
                                        isWaiting
                                            ? 'border-white/[0.08] border-t-4 border-t-rose-500'
                                            : isCooking
                                            ? 'border-white/[0.08] border-t-4 border-t-amber-400'
                                            : 'border-white/[0.08] border-t-4 border-t-emerald-400'
                                    }`}
                                >
                                    {/* Ticket Header: Token & Live Timer */}
                                    <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#08090D]">
                                        <div className="min-w-0">
                                            <div className="flex items-baseline gap-2.5">
                                                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                                                    #{ticket.token_number}
                                                </span>
                                                <span className="text-sm font-bold text-indigo-300 truncate">
                                                    {ticket.order?.table
                                                        ? `Meja ${ticket.order.table.table_number}`
                                                        : 'Bungkus / Takeaway'}
                                                </span>
                                            </div>
                                            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                                                {ticket.order?.invoice_number || 'INV-POS'} • {ticket.order?.customer_name || 'Pelanggan'}
                                            </div>
                                        </div>

                                        {/* Elapsed Timer Badge (Kontras Tinggi) */}
                                        <div
                                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 tabular-nums shrink-0 ${
                                                elapsed.isUrgent
                                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                    : elapsed.isWarning
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                    : 'bg-white/[0.06] text-slate-300 border border-white/[0.08]'
                                            }`}
                                            title="Durasi waktu sejak pesanan dikirim ke dapur"
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{elapsed.text}</span>
                                        </div>
                                    </div>

                                    {/* Ticket Body: Item Name, Quantity, and Special Notes */}
                                    <div className="p-5 space-y-4 flex-1">
                                        {/* Quantity & Product Name */}
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg font-black font-mono text-indigo-300 shrink-0">
                                                {ticket.order_item?.quantity}x
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                                                    {ticket.order_item?.product?.product_name || 'Menu Dapur'}
                                                </h4>
                                                <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                                    {ticket.order_item?.product?.category?.category_name || 'Makanan Masak'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Notes (Sangat Jelas & Menonjol) */}
                                        {ticket.order_item?.notes && (
                                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                                                <strong className="block text-[11px] uppercase tracking-wider text-amber-300 font-mono font-bold flex items-center gap-1.5">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>Catatan Khusus Pelanggan:</span>
                                                </strong>
                                                <p className="text-sm font-semibold text-white leading-relaxed">
                                                    "{ticket.order_item.notes}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Operational Status Indicator */}
                                        <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                    isWaiting ? 'bg-rose-500' : isCooking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                                                }`}
                                            />
                                            <span>
                                                {isWaiting && 'Menunggu Antrean (Belum Diolah)'}
                                                {isCooking && 'Sedang Dimasak di Kompor'}
                                                {isDelivered && 'Sudah Diserahkan ke Meja Kasir'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Progression Button (Tingkat Sentuh Nyaman Min 48px) */}
                                    <div className="p-4 border-t border-white/[0.08] bg-[#08090D]">
                                        {isWaiting && (
                                            <SpecularButton
                                                variant="primary"
                                                size="lg"
                                                icon={Flame}
                                                onClick={() => handleUpdateStatus(ticket.id, 'cooking')}
                                                className="w-full min-h-[48px] text-sm font-bold"
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
                                                className="w-full min-h-[48px] px-4 py-2.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-sm shadow-md border border-amber-400/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                                            >
                                                <Check className="w-5 h-5" />
                                                <span>Selesai Masak &rarr; Bawa ke Kasir</span>
                                            </button>
                                        )}

                                        {isDelivered && (
                                            <div className="min-h-[48px] rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center justify-center gap-2 text-xs font-mono font-bold">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                <span>Menunggu Konfirmasi Kasir</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
