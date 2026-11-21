import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { User, Lock, KeyRound, Check, X, Shield, ShieldCheck } from 'lucide-react';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';
import { toast } from '@/Services/toast';

export default function ProfileModal({ isOpen, onClose }) {
    const { auth = {} } = usePage().props;
    const user = auth?.user || {};

    const { data, setData, post, processing, errors, reset } = useForm({
        full_name: user.full_name || '',
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.new_password && data.new_password !== data.new_password_confirmation) {
            toast.error('Konfirmasi kata sandi baru tidak cocok!');
            return;
        }

        post('/profile/update', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profil dan kredensial akun berhasil diperbarui!');
                reset('current_password', 'new_password', 'new_password_confirmation');
                onClose();
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0];
                toast.error(firstMsg || 'Gagal memperbarui profil.');
            },
        });
    };

    return (
        <AcrylicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Profil Pengguna & Keamanan"
            subtitle="Kelola informasi nama lengkap dan perbarui kata sandi akun Anda."
            maxWidth="max-w-md"
            footer={
                <div className="flex items-center justify-between w-full">
                    <SpecularButton
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={processing}
                        className="min-h-[42px] px-4"
                    >
                        Batal
                    </SpecularButton>
                    <SpecularButton
                        variant="primary"
                        size="md"
                        icon={Check}
                        loading={processing}
                        onClick={handleSubmit}
                        className="min-h-[42px] px-5 font-bold"
                    >
                        Simpan Perubahan
                    </SpecularButton>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account Info Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#312E81] to-[#1E1B4B] border border-indigo-400/30 text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {user.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                                @{user.username}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block capitalize">
                                Role Akses: <strong className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{user.role}</strong>
                            </span>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Aktif
                    </span>
                </div>

                <div className="space-y-3">
                    <AcrylicInput
                        label="Nama Lengkap Staf"
                        value={data.full_name}
                        onChange={(e) => setData('full_name', e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        error={errors.full_name}
                        required
                    />

                    <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Ganti Kata Sandi (Opsional)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                            Kosongkan jika Anda tidak ingin mengubah kata sandi akun saat ini.
                        </p>

                        <div className="space-y-3">
                            <AcrylicInput
                                label="Kata Sandi Saat Ini"
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                placeholder="Masukkan password lama..."
                                error={errors.current_password}
                            />

                            <AcrylicInput
                                label="Kata Sandi Baru"
                                type="password"
                                value={data.new_password}
                                onChange={(e) => setData('new_password', e.target.value)}
                                placeholder="Minimal 6 karakter..."
                                error={errors.new_password}
                            />

                            <AcrylicInput
                                label="Konfirmasi Kata Sandi Baru"
                                type="password"
                                value={data.new_password_confirmation}
                                onChange={(e) => setData('new_password_confirmation', e.target.value)}
                                placeholder="Ulangi kata sandi baru..."
                            />
                        </div>
                    </div>
                </div>
            </form>
        </AcrylicModal>
    );
}
