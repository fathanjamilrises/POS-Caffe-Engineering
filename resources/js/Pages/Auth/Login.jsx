import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Store, User, Lock, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import GuestAcrylicLayout from '@/Layouts/GuestAcrylicLayout';

export default function Login({ demo_accounts = [] }) {
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

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
        setSelectedRole(account.role);
        setData({
            username: account.username,
            password: 'password123',
            remember: true,
        });
    };

    return (
        <GuestAcrylicLayout fullScreen={true}>
            <Head title="Masuk" />

            <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
                {/* ============================== */}
                {/* LEFT PANEL: Brand & Context    */}
                {/* ============================== */}
                <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[#0A0C14] border-r border-white/[0.06] relative overflow-hidden">
                    {/* Subtle grid texture */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Top: Logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/20">
                            <Store className="w-[18px] h-[18px] text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-200 tracking-tight">
                            POS-Caffe Engineering
                        </span>
                    </div>

                    {/* Center: Headline */}
                    <div className="relative z-10 max-w-lg space-y-5">
                        <h1 className="text-3xl xl:text-4xl font-bold text-white leading-[1.2] tracking-tight">
                            Kelola kasir, dapur,
                            <br />
                            dan laporan dalam
                            <br />
                            satu platform.
                        </h1>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                            Sistem POS terintegrasi dengan pemesanan QR meja, 
                            kitchen display real-time, dan pelaporan keuangan otomatis.
                        </p>
                    </div>

                    {/* Bottom: Version */}
                    <div className="relative z-10 text-xs text-slate-500">
                        v1.0 — Laravel &middot; React &middot; Inertia
                    </div>
                </section>

                {/* ============================== */}
                {/* RIGHT PANEL: Login Form        */}
                {/* ============================== */}
                <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14 xl:p-16 bg-[#07080D]">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        {/* Mobile Logo (only shown on small screens) */}
                        <div className="lg:hidden flex items-center gap-3 pb-6 border-b border-white/[0.06]">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/20">
                                <Store className="w-[18px] h-[18px] text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-200 tracking-tight">
                                POS-Caffe Engineering
                            </span>
                        </div>

                        {/* Header */}
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Masuk ke akun Anda
                            </h2>
                            <p className="text-sm text-slate-400">
                                Masukkan kredensial untuk melanjutkan.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username */}
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-xs font-medium text-slate-300">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="Masukkan username"
                                        required
                                        autoComplete="username"
                                        className={`w-full bg-[#0C0E16] border rounded-lg text-sm text-white placeholder-slate-500 pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors ${
                                            errors.username
                                                ? 'border-rose-500/60'
                                                : 'border-white/[0.1]'
                                        }`}
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-xs text-rose-400">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password"
                                        required
                                        autoComplete="current-password"
                                        className={`w-full bg-[#0C0E16] border rounded-lg text-sm text-white placeholder-slate-500 pl-10 pr-10 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors ${
                                            errors.password
                                                ? 'border-rose-500/60'
                                                : 'border-white/[0.1]'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-400">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded bg-[#0C0E16] border-white/15 text-indigo-600 focus:ring-indigo-500/40 w-3.5 h-3.5"
                                />
                                <span className="text-xs text-slate-400">Ingat saya</span>
                            </label>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-10 rounded-lg text-sm font-medium text-white bg-gradient-to-b from-[#4F46E5] to-[#3730A3] border border-indigo-400/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:from-[#4338CA] hover:to-[#312E81] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <>
                                        Masuk
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Accounts */}
                        {demo_accounts.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-[11px] text-slate-500">atau pilih akun demo</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>

                                <div className="space-y-1.5">
                                    {demo_accounts.map((acc) => {
                                        const isSelected = selectedRole === acc.role;
                                        return (
                                            <button
                                                key={acc.username}
                                                type="button"
                                                onClick={() => handleSelectDemo(acc)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-indigo-500/[0.08] border-indigo-500/30'
                                                        : 'bg-transparent border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]'
                                                }`}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                        isSelected
                                                            ? 'bg-indigo-500/20 text-indigo-300'
                                                            : 'bg-white/[0.05] text-slate-400'
                                                    }`}
                                                >
                                                    {acc.role.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-slate-200">{acc.name}</div>
                                                    <div className="text-xs text-slate-500">@{acc.username}</div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </GuestAcrylicLayout>
    );
}
