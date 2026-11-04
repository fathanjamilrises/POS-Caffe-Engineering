import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, User, Lock, ArrowRight, ShieldCheck, Store } from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';
import AcrylicCard from '@/Components/Acrylic/AcrylicCard';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import AcrylicBadge from '@/Components/Acrylic/AcrylicBadge';

export default function Login({ demo_accounts = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const handleSelectDemo = (account) => {
        setData({
            username: account.username,
            password: 'password123',
            remember: true,
        });
    };

    return (
        <GuestAcrylicLayout>
            <Head title="Masuk - Kasir & POS System" />

            <div className="w-full max-w-md space-y-6">
                <AcrylicCard
                    className="p-1 sm:p-2 border-white/[0.06]"
                    contentClassName="p-6 sm:p-8 space-y-6"
                >
                    <div className="text-center space-y-1.5">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-b from-[#4338CA] to-[#312E81] border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] mb-2">
                            <KeyRound className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-100">
                            Masuk ke Terminal
                        </h2>
                        <p className="text-xs text-slate-400">
                            Pilih akun demo atau masukkan kredensial resmi Anda.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AcrylicInput
                            label="Username"
                            icon={User}
                            type="text"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            placeholder="Contoh: admin, kasir1, chef1"
                            error={errors.username}
                            required
                        />

                        <AcrylicInput
                            label="Kata Sandi (Password)"
                            icon={Lock}
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            error={errors.password}
                            required
                        />

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>Ingat saya di perangkat ini</span>
                            </label>
                        </div>

                        <SpecularButton
                            type="submit"
                            variant="primary"
                            size="md"
                            loading={processing}
                            className="w-full mt-2"
                            icon={ArrowRight}
                            iconPosition="right"
                        >
                            Masuk ke Sistem
                        </SpecularButton>
                    </form>

                    {/* Quick Demo Accounts Selection */}
                    {demo_accounts.length > 0 && (
                        <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center font-medium">
                                Akses Cepat Akun Demo (1-Tap)
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {demo_accounts.map((acc) => (
                                    <button
                                        key={acc.username}
                                        type="button"
                                        onClick={() => handleSelectDemo(acc)}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-medium text-slate-300">
                                                {acc.role.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                                                    {acc.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                    @{acc.username}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                                            {acc.badge}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </AcrylicCard>

                {/* Footer security badge */}
                <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Terhubung dengan enkripsi AES-256 & sesi server aman.</span>
                </div>
            </div>
        </GuestAcrylicLayout>
    );
}

