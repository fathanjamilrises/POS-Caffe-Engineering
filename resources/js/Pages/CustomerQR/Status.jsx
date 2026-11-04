import React, { useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    ChefHat,
    Utensils,
    QrCode,
    RefreshCw,
    Receipt,
    PlusCircle,
    Store,
    Sparkles,
} from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

export default function CustomerQrStatus({ table, order }) {
    // Gentle auto-refresh every 8 seconds to reflect kitchen progress
    useEffect(() => {
        if (order.order_status === 'served') return;

        const interval = setInterval(() => {
            router.reload({
                only: ['order'],
                preserveScroll: true,
            });
        }, 8000);

        return () => clearInterval(interval);
    }, [order.order_status]);

    const handleManualRefresh = () => {
        router.reload({
            only: ['order'],
            preserveScroll: true,
        });
    };

    // Determine stepper progress
    // order_status can be: 'pending', 'processing', 'ready', 'served', 'cancelled'
    const getStepStatus = (stepIndex) => {
        const statusMap = {
            pending: 1,
            processing: 2,
            ready: 3,
            served: 4,
            cancelled: 0,
        };

        const currentStep = statusMap[order.order_status] || 1;
        if (order.order_status === 'cancelled') return 'cancelled';
        if (currentStep > stepIndex) return 'completed';
        if (currentStep === stepIndex) return 'current';
        return 'upcoming';
    };

    const steps = [
        {
            title: 'Diterima Kasir',
            desc: 'Pesanan masuk & antrian terbit',
            icon: Receipt,
        },
        {
            title: 'Diproses Dapur',
            desc: 'Koki sedang memasak hidangan',
            icon: ChefHat,
        },
        {
            title: 'Siap Disajikan',
            desc: 'Makanan telah siap di counter',
            icon: Clock,
        },
        {
            title: 'Pesanan Selesai',
            desc: 'Telah dinikmati di meja Anda',
            icon: Utensils,
        },
    ];

    return (
        <GuestAcrylicLayout title={`Status Pesanan ${order.token_number}`} centered={true}>
            <Head title={`Status Pesanan #${order.token_number} - Kasir App`} />

            <div className="w-full max-w-xl mx-auto space-y-6">
                {/* Hero Token Header Card */}
                <AcrylicCard
                    className="p-6 text-center bg-[#0B0D13] border-white/[0.06]"
                >
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono font-medium mb-3">
                        <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Meja: {table.table_number}</span>
                    </div>

                    <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Nomor Antrian Pesanan Anda
                    </div>

                    <div className="mt-2 text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-100 tabular-nums">
                        #{order.token_number}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2">
                        <AcrylicBadge
                            variant={
                                order.order_status === 'served'
                                    ? 'emerald'
                                    : order.order_status === 'ready'
                                    ? 'cobalt'
                                    : order.order_status === 'processing'
                                    ? 'amber'
                                    : 'indigo'
                            }
                            size="md"
                            dot={true}
                        >
                            {order.order_status === 'served' && 'Pesanan Selesai'}
                            {order.order_status === 'ready' && 'Siap Diantar ke Meja'}
                            {order.order_status === 'processing' && 'Sedang Dimasak Koki'}
                            {order.order_status === 'pending' && 'Menunggu Antrian Dapur'}
                        </AcrylicBadge>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
                        Silakan duduk santai di meja Anda. Makanan dan minuman akan diantarkan
                        langsung begitu selesai dipersiapkan.
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleManualRefresh}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white font-medium transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Perbarui Status</span>
                        </button>
                    </div>
                </AcrylicCard>

                {/* Live Progress Stepper */}
                <AcrylicCard className="p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Perjalanan Pesanan</span>
                    </h3>

                    <div className="space-y-4">
                        {steps.map((step, idx) => {
                            const state = getStepStatus(idx + 1);
                            const StepIcon = step.icon;

                            return (
                                <div key={step.title} className="flex items-start gap-3.5 relative">
                                    {/* Connecting vertical line */}
                                    {idx < steps.length - 1 && (
                                        <div
                                            className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                                                state === 'completed'
                                                    ? 'bg-emerald-500/40'
                                                    : 'bg-white/[0.06]'
                                            }`}
                                        />
                                    )}

                                    {/* Step Icon Badge */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                            state === 'completed'
                                                ? 'bg-emerald-500 text-white'
                                                : state === 'current'
                                                ? 'bg-[#4338CA] text-white ring-2 ring-indigo-400/40'
                                                : 'bg-white/[0.04] text-slate-500 border border-white/[0.08]'
                                        }`}
                                    >
                                        {state === 'completed' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <StepIcon className="w-4 h-4" />
                                        )}
                                    </div>

                                    {/* Step Description */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div
                                            className={`text-xs font-semibold ${
                                                state === 'current'
                                                    ? 'text-indigo-300'
                                                    : state === 'completed'
                                                    ? 'text-slate-200'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {step.title}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                            {step.desc}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AcrylicCard>

                {/* Order Summary & Items Breakdown */}
                <AcrylicCard className="p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                        <div>
                            <div className="text-xs font-semibold text-slate-200">Rincian Menu Dipesan</div>
                            <div className="text-[11px] font-mono text-slate-400">
                                {order.invoice_number}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">
                                Pemesan
                            </span>
                            <span className="text-xs font-medium text-slate-200">
                                {order.customer_name}
                            </span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2.5">
                        {order.items?.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium text-slate-200 truncate">
                                        {item.quantity}x {item.product?.product_name || 'Menu'}
                                    </div>
                                    {item.notes && (
                                        <div className="text-[10px] text-indigo-300/80 italic">
                                            "{item.notes}"
                                        </div>
                                    )}
                                </div>
                                <div className="font-mono tabular-nums text-slate-300 flex-shrink-0">
                                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400">Metode: </span>
                            <span className="text-xs font-medium uppercase text-slate-200 font-mono">
                                {order.payment_method} ({order.payment_status})
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-base font-bold font-mono tabular-nums text-slate-100">
                                Rp {Number(order.total_amount).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>
                </AcrylicCard>

                {/* Additional Order Action */}
                <div className="text-center pt-2">
                    <Link
                        href={`/table/${table.qr_code_token}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-colors"
                    >
                        <PlusCircle className="w-4 h-4 text-indigo-400" />
                        <span>Pesan Menu Tambahan untuk Meja Ini</span>
                    </Link>
                </div>
            </div>
        </GuestAcrylicLayout>
    );
}

