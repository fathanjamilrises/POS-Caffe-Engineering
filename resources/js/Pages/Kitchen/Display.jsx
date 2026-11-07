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
    Check,
    Bell,
    Search,
    ChevronDown,
    Filter,
} from 'lucide-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { useAudioAlert } from '@/Hooks/useAudioAlert';
import { toast } from '@/Services/toast';

export default function KitchenDisplay({ tickets = [], unnotified_count = 0 }) {
    // Smart default: 'active' if active orders exist, otherwise 'all' so screen is never blank
    const [statusFilter, setStatusFilter] = useState(() => {
        const hasActive = tickets.some((t) => t.ticket_status !== 'completed');
        return hasActive ? 'active' : 'all';
    });

    const [searchQuery, setSearchQuery] = useState('');
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

    // Trigger audio chime & toast alert when new unnotified tickets arrive
    useEffect(() => {
        if (unnotified_count > 0) {
            if (!audioMuted) {
                playChime();
            }
            toast.info(`${unnotified_count} pesanan baru masuk ke antrean dapur!`, {
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

    // Calculate elapsed time or completed duration
    const getElapsedTime = (ticket) => {
        const sentAt = ticket.sent_to_kds_at;
        if (!sentAt) return { text: '00:00', minutes: 0, isUrgent: false, isWarning: false, isCompleted: false };

        const sentTime = new Date(sentAt).getTime();

        if (ticket.ticket_status === 'completed' && ticket.completed_at) {
            const completedTime = new Date(ticket.completed_at).getTime();
            const totalSecs = Math.max(0, Math.floor((completedTime - sentTime) / 1000));
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;

            // Only show cooking duration if reasonable (< 120 minutes)
            const text = mins < 120 ? `${mins}m ${secs}d` : '';
            return {
                text,
                minutes: mins,
                isUrgent: false,
                isWarning: false,
                isCompleted: true,
            };
        }

        const diffSecs = Math.max(0, Math.floor((now - sentTime) / 1000));
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        const text = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        return {
            text,
            minutes: mins,
            isWarning: mins >= 5 && mins < 10,
            isUrgent: mins >= 10,
            isCompleted: false,
        };
    };

    // Status counts based on actual live data
    const counts = useMemo(() => {
        const waiting = tickets.filter((t) => t.ticket_status === 'waiting').length;
        const cooking = tickets.filter((t) => t.ticket_status === 'cooking').length;
        const delivered = tickets.filter((t) => t.ticket_status === 'delivered_to_cashier').length;
        const completed = tickets.filter((t) => t.ticket_status === 'completed').length;
        const active = waiting + cooking + delivered;
        const kitchenQueue = waiting + cooking;

        return {
            all: tickets.length,
            active,
            kitchenQueue,
            waiting,
            cooking,
            delivered,
            completed,
        };
    }, [tickets]);

    // Filter tickets by dropdown selection and search query
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            // Dropdown filter
            if (statusFilter === 'active') {
                if (t.ticket_status === 'completed') return false;
            } else if (statusFilter !== 'all') {
                if (t.ticket_status !== statusFilter) return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const tokenMatch = String(t.token_number).includes(q);
                const tableMatch = t.order?.table?.table_number && String(t.order.table.table_number).includes(q);
                const customerMatch = t.order?.customer_name && t.order.customer_name.toLowerCase().includes(q);
                const productMatch = t.order_item?.product?.product_name && t.order_item.product.product_name.toLowerCase().includes(q);
                const notesMatch = t.order_item?.notes && t.order_item.notes.toLowerCase().includes(q);

                if (!tokenMatch && !tableMatch && !customerMatch && !productMatch && !notesMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [tickets, statusFilter, searchQuery]);

    // Top Metric Cards
    const metricCards = [
        {
            label: 'Perlu Dimasak',
            value: counts.kitchenQueue,
            subtext: `${counts.waiting} menunggu • ${counts.cooking} dimasak`,
            icon: ChefHat,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
            valueColor: counts.kitchenQueue > 0 ? 'text-white' : 'text-slate-400',
        },
        {
            label: 'Menunggu Dimasak',
            value: counts.waiting,
            subtext: counts.waiting > 0 ? 'Tiket baru belum diolah' : 'Tidak ada tiket menunggu',
            icon: Clock,
            iconBg: 'bg-rose-500/10',
            iconColor: 'text-rose-400',
            valueColor: counts.waiting > 0 ? 'text-rose-300' : 'text-slate-400',
        },
        {
            label: 'Sedang Dimasak',
            value: counts.cooking,
            subtext: counts.cooking > 0 ? 'Sedang di proses kompor' : 'Kompor senggang',
            icon: Flame,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-400',
            valueColor: counts.cooking > 0 ? 'text-amber-300' : 'text-slate-400',
        },
        {
            label: 'Siap di Kasir / Selesai',
            value: `${counts.delivered} / ${counts.completed}`,
            subtext: `${counts.delivered} di kasir • ${counts.completed} selesai saji`,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
            valueColor: counts.delivered > 0 ? 'text-emerald-300' : 'text-slate-300',
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
                                    <span className="hidden sm:inline">Bell Senyap</span>
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

            <div className="space-y-5">
                {/* ============================================================
                    TOP METRIC CARDS (RINGKASAN DATA DAPUR)
                ============================================================ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {metricCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className={`text-2xl font-bold font-mono tabular-nums ${card.valueColor}`}>
                                        {card.value}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                        {card.subtext}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ============================================================
                    TOOLBAR: DROPDOWN FILTER & SEARCH (TANPA SCROLLBAR)
                ============================================================ */}
                <div className="bg-[#0B0D13] border border-white/[0.07] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
                            <Filter className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Filter Status:</span>
                        </div>
                        <div className="relative flex-1 sm:w-64">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 rounded-lg bg-[#06070A] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-colors"
                            >
                                <option value="all">Semua Tiket ({counts.all})</option>
                                <option value="active">Antrean Aktif ({counts.active})</option>
                                <option value="waiting">Menunggu Dimasak ({counts.waiting})</option>
                                <option value="cooking">Sedang Dimasak ({counts.cooking})</option>
                                <option value="delivered_to_cashier">Di Meja Kasir ({counts.delivered})</option>
                                <option value="completed">Selesai Hari Ini ({counts.completed})</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Search & Auto-Sync Indicator */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari token, meja, menu..."
                                className="w-full h-10 pl-8 pr-7 rounded-lg bg-[#06070A] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white px-1 text-sm"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="hidden md:inline">Sinkron Otomatis (6s)</span>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    KDS MINIMALIST CARD GRID (FOKUS KOKI, TATA LETAK RAPI)
                ============================================================ */}
                {filteredTickets.length === 0 ? (
                    <div className="py-20 text-center bg-[#0B0D13] rounded-xl border border-white/[0.07] p-8 space-y-3">
                        <ChefHat className="w-14 h-14 mx-auto text-slate-600 opacity-40" />
                        <h3 className="text-base font-bold text-white">
                            {searchQuery
                                ? 'Tidak Ditemukan Tiket yang Cocok'
                                : statusFilter === 'active'
                                ? 'Semua Antrean Dapur Sedang Kosong'
                                : 'Tidak Ada Tiket di Kategori Ini'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            {searchQuery
                                ? `Tidak ada tiket dengan kata kunci "${searchQuery}". Coba bersihkan pencarian.`
                                : statusFilter === 'active'
                                ? 'Tidak ada masakan aktif yang perlu dimasak saat ini. Tiket baru dari kasir atau QR meja akan otomatis muncul.'
                                : 'Gunakan tombol di bawah untuk menampilkan seluruh riwayat tiket hari ini.'}
                        </p>
                        {statusFilter !== 'all' && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition-colors shadow-sm"
                                >
                                    <span>Tampilkan Semua Tiket ({counts.all})</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTickets.map((ticket) => {
                            const elapsed = getElapsedTime(ticket);
                            const isWaiting = ticket.ticket_status === 'waiting';
                            const isCooking = ticket.ticket_status === 'cooking';
                            const isDelivered = ticket.ticket_status === 'delivered_to_cashier';
                            const isCompleted = ticket.ticket_status === 'completed';

                            return (
                                <div
                                    key={ticket.id}
                                    className={`rounded-xl border bg-[#0B0D13] flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-200 ${
                                        isWaiting
                                            ? 'border-white/[0.08] border-t-2 border-t-rose-500'
                                            : isCooking
                                            ? 'border-white/[0.08] border-t-2 border-t-amber-400'
                                            : isDelivered
                                            ? 'border-white/[0.08] border-t-2 border-t-indigo-400'
                                            : 'border-white/[0.08] border-t-2 border-t-emerald-500 opacity-75'
                                    }`}
                                >
                                    {/* 1. Header: 2 Baris Bersih & Bebas Tabrakan */}
                                    <div className="p-3.5 border-b border-white/[0.06] bg-[#07080C] space-y-2">
                                        {/* Baris 1: Token & Status Badge (Hanya 2 elemen, tidak akan bertumpuk) */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                                                #{ticket.token_number}
                                            </span>

                                            {/* Status Badge + Live Timer */}
                                            <div className="shrink-0">
                                                {isWaiting && (
                                                    <div
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                                                            elapsed.isUrgent
                                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                                                        }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                        <span>Menunggu</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span>{elapsed.text}</span>
                                                    </div>
                                                )}

                                                {isCooking && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                        <span>Dimasak</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span>{elapsed.text}</span>
                                                    </div>
                                                )}

                                                {isDelivered && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        <span>Di Kasir</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span>{elapsed.text}</span>
                                                    </div>
                                                )}

                                                {isCompleted && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Selesai</span>
                                                        {elapsed.text && (
                                                            <span className="text-slate-400 font-normal">
                                                                ({elapsed.text})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Baris 2: Badge Meja/Bungkus & Nama Pelanggan (Terpisah jelas) */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                                            {ticket.order?.table ? (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0">
                                                    Meja #{ticket.order.table.table_number}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                                                    Bungkus
                                                </span>
                                            )}
                                            <span className="text-[11px] font-mono text-slate-400 truncate">
                                                {ticket.order?.customer_name || 'Pelanggan'} •{' '}
                                                {ticket.order?.order_source === 'qr_table'
                                                    ? 'QR HP'
                                                    : 'Kasir'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Body: Menu & Catatan Khusus */}
                                    <div className="p-4 flex-1 space-y-3">
                                        {/* Quantity & Product Name */}
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl font-black font-mono text-indigo-400 shrink-0 leading-none mt-0.5">
                                                {ticket.order_item?.quantity}x
                                            </span>
                                            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                                                {ticket.order_item?.product?.product_name || 'Menu Dapur'}
                                            </h3>
                                        </div>

                                        {/* Catatan Khusus (Hanya tampil jika ada) */}
                                        {ticket.order_item?.notes && (
                                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
                                                <span className="font-bold text-amber-300 font-mono text-[10px] uppercase block mb-0.5">
                                                    Catatan:
                                                </span>
                                                "{ticket.order_item.notes}"
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Footer: Tombol Aksi Koki (Min 44px) */}
                                    <div className="p-3 border-t border-white/[0.06] bg-[#07080C]">
                                        {isWaiting && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus(ticket.id, 'cooking')}
                                                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white font-bold text-xs flex items-center justify-center gap-2 border border-indigo-400/25 shadow-sm active:scale-[0.99] transition-all"
                                            >
                                                <Flame className="w-4 h-4 text-amber-300" />
                                                <span>Mulai Masak</span>
                                            </button>
                                        )}

                                        {isCooking && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateStatus(ticket.id, 'delivered_to_cashier')
                                                }
                                                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-amber-400/30 shadow-sm active:scale-[0.99] transition-all"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Selesai Masak &rarr; Bawa ke Kasir</span>
                                            </button>
                                        )}

                                        {isDelivered && (
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-h-[40px] flex-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center gap-1.5 text-xs font-mono font-medium px-2 text-center">
                                                    <span>Di Meja Kasir</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateStatus(ticket.id, 'completed')}
                                                    className="min-h-[40px] px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors"
                                                    title="Tandai tiket ini selesai jika sudah diserahkan langsung"
                                                >
                                                    Selesaikan
                                                </button>
                                            </div>
                                        )}

                                        {isCompleted && (
                                            <div className="min-h-[40px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1.5 text-xs font-mono font-bold">
                                                <Check className="w-4 h-4" />
                                                <span>Pesanan Selesai Disajikan</span>
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
