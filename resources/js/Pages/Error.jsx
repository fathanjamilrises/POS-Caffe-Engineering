import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertOctagon, ArrowLeft, Home, RotateCcw } from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';

export default function ErrorPage({ status = 404, message = null }) {
    const errorDetails = {
        403: {
            title: 'Akses Ditolak (403 Forbidden)',
            description:
                message ||
                'Anda tidak memiliki izin atau peran yang memadai untuk mengakses halaman ini. Hubungi administrator jika ini adalah kesalahan.',
            badge: 'Unauthorized Role',
            variant: 'rose',
        },
        404: {
            title: 'Halaman Tidak Ditemukan (404 Not Found)',
            description:
                message ||
                'Halaman yang Anda tuju tidak ditemukan atau URL mungkin telah dipindahkan ke rute lain.',
            badge: 'Route Missing',
            variant: 'amber',
        },
        500: {
            title: 'Terjadi Kesalahan Server (500 Error)',
            description:
                message ||
                'Server mengalami gangguan saat memproses permintaan Anda. Silakan coba kembali beberapa saat lagi.',
            badge: 'Internal Server Error',
            variant: 'rose',
        },
        419: {
            title: 'Sesi Telah Kedaluwarsa (419 Expired)',
            description:
                message ||
                'Sesi keamanan Anda telah berakhir karena tidak ada aktivitas. Silakan refresh dan masuk kembali.',
            badge: 'Session Timeout',
            variant: 'indigo',
        },
    };

    const current = errorDetails[status] || errorDetails[404];

    return (
        <GuestAcrylicLayout>
            <Head title={`${status} - ${current.title}`} />

            <div className="w-full max-w-lg text-center space-y-6">
                <AcrylicCard
                    className="p-8 border-white/[0.06]"
                    contentClassName="space-y-6"
                >
                    <div className="space-y-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                            {current.badge}
                        </span>

                        {/* Status Code */}
                        <div className="text-7xl font-extrabold font-mono tabular-nums tracking-tighter text-slate-100">
                            {status}
                        </div>

                        <h2 className="text-lg font-bold text-slate-100 tracking-wide">
                            {current.title}
                        </h2>

                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                            {current.description}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali</span>
                        </button>

                        <Link href="/">
                            <SpecularButton
                                variant="primary"
                                size="sm"
                                icon={Home}
                            >
                                Ke Halaman Utama
                            </SpecularButton>
                        </Link>
                    </div>
                </AcrylicCard>
            </div>
        </GuestAcrylicLayout>
    );
}

