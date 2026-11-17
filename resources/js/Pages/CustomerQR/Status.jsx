import React, { useEffect, useState } from 'react';
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
    PhoneCall,
    Bell,
    Check,
    HelpCircle,
    UtensilsCrossed,
    FileText,
} from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import { toast } from '@/Services/toast';

export default function CustomerQrStatus({ table, order }) {
    const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
    const [assistanceType, setAssistanceType] = useState('waiter');
    const [callingWaiter, setCallingWaiter] = useState(false);
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

    const handleCallWaiter = (type = 'waiter') => {
        setCallingWaiter(true);
        router.post(
            `/table/${table.qr_code_token}/call-waiter`,
            { assistance_type: type },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCallingWaiter(false);
                    setIsCallWaiterOpen(false);
                    toast.success('Panggilan telah terkirim ke staf kasir!');
                },
                onError: () => {
                    setCallingWaiter(false);
                    toast.error('Gagal mengirim panggilan ke kasir.');
                },
            }
        );
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

    const isUnpaid = order.payment_status === 'unpaid';

    const steps = [
        {
            title: isUnpaid ? 'Menunggu Pembayaran Kasir' : 'Dikonfirmasi Kasir',
            desc: isUnpaid ? 'Silakan bayar di meja kasir' : 'Pembayaran diterima & antrean terbit',
            icon: Receipt,
        },
        {
            title: 'Diproses Dapur',
            desc: 'Koki sedang memasak hidangan',
            icon: ChefHat,
        },
        {
            title: 'Siap Disajikan',
            desc: 'Makanan telah siap di counter / meja',
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
                        <span>{table.table_number.toLowerCase().startsWith('meja') ? table.table_number : `Meja ${table.table_number}`}</span>
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
                                order.order_status === 'cancelled'
                                    ? 'rose'
                                    : order.order_status === 'served'
                                    ? 'emerald'
                                    : order.order_status === 'ready'
                                    ? 'cobalt'
                                    : order.order_status === 'processing'
                                    ? 'amber'
                                    : isUnpaid
                                    ? 'amber'
                                    : 'indigo'
                            }
                            size="md"
                            dot={true}
                        >
                            {order.order_status === 'cancelled' && 'Pesanan Dibatalkan'}
                            {order.order_status === 'served' && 'Pesanan Selesai'}
                            {order.order_status === 'ready' && 'Siap Diantar ke Meja'}
                            {order.order_status === 'processing' && 'Sedang Dimasak Koki'}
                            {order.order_status === 'pending' && isUnpaid && 'Menunggu Pembayaran Kasir'}
                            {order.order_status === 'pending' && !isUnpaid && 'Menunggu Antrean Dapur'}
                        </AcrylicBadge>
                    </div>

                    {isUnpaid && order.order_status !== 'cancelled' ? (
                        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left space-y-2">
                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>Menunggu Konfirmasi Pembayaran ({order.payment_method.toUpperCase()})</span>
                            </div>
                            <p className="leading-relaxed text-[11px] text-amber-200/90">
                                Total tagihan: <strong className="text-white font-mono font-bold text-xs">Rp {Number(order.total_amount).toLocaleString('id-ID')}</strong>.
                                {order.payment_method === 'qris'
                                    ? ' Silakan scan QRIS di meja atau tunjukkan kode Token ke kasir untuk menyelesaikan transaksi.'
                                    : ` Silakan menuju meja kasir dan sebutkan ${table.table_number.toLowerCase().startsWith('meja') ? table.table_number : `Meja ${table.table_number}`} atau Token #${order.token_number}.`}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
                            Silakan duduk santai di meja Anda. Makanan dan minuman akan diantarkan
                            langsung begitu selesai dipersiapkan.
                        </p>
                    )}

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

                {/* Additional Order Action & Call Waiter */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsCallWaiterOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Panggil Pelayan / Bantuan Meja</span>
                    </button>

                    <Link
                        href={`/table/${table.qr_code_token}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all"
                    >
                        <PlusCircle className="w-4 h-4 text-indigo-400" />
                        <span>Pesan Menu Tambahan</span>
                    </Link>
                </div>

                {/* Call Waiter Modal */}
                <AcrylicModal
                    isOpen={isCallWaiterOpen}
                    onClose={() => setIsCallWaiterOpen(false)}
                    title={`Panggil Pelayan - Meja ${table.table_number}`}
                    subtitle="Pilih jenis bantuan yang Anda butuhkan"
                    maxWidth="max-w-sm"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <SpecularButton
                                variant="secondary"
                                size="md"
                                onClick={() => setIsCallWaiterOpen(false)}
                            >
                                Batal
                            </SpecularButton>
                            <SpecularButton
                                variant="primary"
                                size="md"
                                disabled={callingWaiter}
                                onClick={() => handleCallWaiter(assistanceType)}
                            >
                                {callingWaiter ? 'Memanggil...' : 'Kirim Panggilan'}
                            </SpecularButton>
                        </div>
                    }
                >
                    <div className="space-y-2.5 text-xs">
                        {[
                            { id: 'waiter', label: 'Bantuan Pelayan ke Meja', desc: 'Pelayan akan segera mendatangi meja Anda' },
                            { id: 'cutlery', label: 'Minta Alat Makan / Sendok', desc: 'Sendok, garpu, tisu, atau sedotan' },
                            { id: 'bill', label: 'Minta Nota / Bayar di Meja', desc: 'Pengecekan tagihan akhir di meja' },
                            { id: 'cleaning', label: 'Minta Bersihkan Meja', desc: 'Pembersihan meja atau piring kotor' },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setAssistanceType(opt.id)}
                                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                    assistanceType === opt.id
                                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-slate-300'
                                }`}
                            >
                                <span className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${assistanceType === opt.id ? 'border-indigo-400 bg-indigo-600' : 'border-slate-500'}`}>
                                    {assistanceType === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                                <div>
                                    <div className="font-bold">{opt.label}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </AcrylicModal>
            </div>
        </GuestAcrylicLayout>
    );
}

