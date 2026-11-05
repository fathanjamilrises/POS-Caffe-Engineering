import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Shield,
    KeyRound,
    UserCheck,
    UserX,
    Lock,
    User,
    CheckCircle2,
    AlertTriangle,
    X,
    ChefHat,
    Check,
} from 'lucide-react';

import AdminAcrylicLayout from '@/Layouts/AdminAcrylicLayout';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

export default function AdminUsersIndex({
    users = { data: [], links: [] },
    metrics = {
        total_users: 0,
        admin_count: 0,
        kasir_count: 0,
        dapur_count: 0,
        active_count: 0,
    },
    filters = {},
}) {
    const { auth = {} } = usePage().props;
    const currentUserId = auth?.user?.id;

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form: Create User
    const {
        data: createData,
        setData: setCreateData,
        post: postUser,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        full_name: '',
        username: '',
        role: 'kasir',
        password: '',
        is_active: true,
    });

    // Form: Edit User
    const {
        data: editData,
        setData: setEditData,
        put: putUser,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        full_name: '',
        username: '',
        role: 'kasir',
        password: '',
        is_active: true,
    });

    // Trigger Server-side Filtering
    const triggerFilter = (newFilters = {}) => {
        router.get(
            '/admin/users',
            {
                search: newFilters.search !== undefined ? newFilters.search : searchQuery,
                role: newFilters.role !== undefined ? newFilters.role : roleFilter,
                status: newFilters.status !== undefined ? newFilters.status : statusFilter,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        resetCreate();
        setCreateData({
            full_name: '',
            username: '',
            role: 'kasir',
            password: '',
            is_active: true,
        });
        setIsCreateModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setEditData({
            full_name: user.full_name,
            username: user.username,
            role: user.role,
            password: '',
            is_active: Boolean(user.is_active),
        });
        setIsEditModalOpen(true);
    };

    // Open Delete Modal
    const handleOpenDelete = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    // Toggle Active Status
    const handleToggleStatus = (user) => {
        if (user.id === currentUserId) return;
        router.patch(`/admin/users/${user.id}/toggle-status`, {}, { preserveScroll: true });
    };

    // Submit Create
    const handleSubmitCreate = (e) => {
        e.preventDefault();
        postUser('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
            },
        });
    };

    // Submit Edit
    const handleSubmitEdit = (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        putUser(`/admin/users/${selectedUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
            },
        });
    };

    // Submit Delete
    const handleConfirmDelete = () => {
        if (!selectedUser) return;
        router.delete(`/admin/users/${selectedUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                        Administrator
                    </span>
                );
            case 'kasir':
                return (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        Kasir POS
                    </span>
                );
            case 'dapur':
                return (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                        Koki Dapur
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.08] whitespace-nowrap">
                        {role}
                    </span>
                );
        }
    };

    // 4 Top Metric Cards (Consistent with Beranda, Produk, Meja, Kitchen)
    const metricCards = [
        {
            label: 'Total Akun Pengguna',
            value: metrics.total_users,
            subtext: `${metrics.active_count} akun status aktif`,
            icon: Users,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
        },
        {
            label: 'Administrator',
            value: metrics.admin_count,
            subtext: 'Akses penuh seluruh sistem',
            icon: Shield,
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
        },
        {
            label: 'Staff Kasir POS',
            value: metrics.kasir_count,
            subtext: 'Operator order & shift kasir',
            icon: UserCheck,
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
        },
        {
            label: 'Staff Koki Dapur',
            value: metrics.dapur_count,
            subtext: 'Operator antrean Kitchen KDS',
            icon: ChefHat,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-400',
        },
    ];

    return (
        <AdminAcrylicLayout
            title="Kelola Pengguna Sistem"
            showSearch={false}
        >
            <Head title="Kelola Pengguna - Kasir App Admin" />

            <div className="space-y-6">
                {/* =========================================================================
                    TOP METRIC CARDS (KONSISTEN DENGAN BERANDA & PRODUK)
                   ========================================================================= */}
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

                {/* =========================================================================
                    FILTER & TOOLBAR (KONSISTEN DENGAN PRODUK & MEJA)
                   ========================================================================= */}
                <div className="bg-[#0C0E16] border border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') triggerFilter({ search: e.target.value });
                            }}
                            placeholder="Cari nama staf atau @username..."
                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg pl-11 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    triggerFilter({ search: '' });
                                }}
                                className="w-8 h-8 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-white"
                                aria-label="Hapus pencarian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Role & Status Filter + CTA */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                triggerFilter({ role: e.target.value });
                            }}
                            className="h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">Semua Peran (Role)</option>
                            <option value="admin">Administrator</option>
                            <option value="kasir">Kasir POS</option>
                            <option value="dapur">Koki Dapur</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                triggerFilter({ status: e.target.value });
                            }}
                            className="h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">Semua Status Akun</option>
                            <option value="active">Status Aktif</option>
                            <option value="inactive">Status Nonaktif</option>
                        </select>

                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={Plus}
                            onClick={handleOpenCreate}
                        >
                            <span>Tambah Pengguna</span>
                        </SpecularButton>
                    </div>
                </div>

                {/* =========================================================================
                    USERS DATA TABLE (ANTI-TUMPANG TINDIH & RAMAH USIA 40-60 TAHUN)
                   ========================================================================= */}
                <div className="rounded-xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 min-w-[850px]">
                            <thead className="bg-[#0A0C14] text-xs text-slate-400 border-b border-white/[0.06]">
                                <tr>
                                    <th className="py-3 px-4 font-medium whitespace-nowrap min-w-[220px]">
                                        Profil Pengguna
                                    </th>
                                    <th className="py-3 px-4 font-medium whitespace-nowrap w-[150px]">
                                        Peran (Role)
                                    </th>
                                    <th className="py-3 px-4 font-medium whitespace-nowrap w-[140px]">
                                        Status Akun
                                    </th>
                                    <th className="py-3 px-4 font-medium text-center whitespace-nowrap w-[140px]">
                                        Aktivitas Shift
                                    </th>
                                    <th className="py-3 px-4 font-medium whitespace-nowrap w-[130px]">
                                        Terdaftar
                                    </th>
                                    <th className="py-3 px-4 font-medium text-right whitespace-nowrap w-[120px]">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-500">
                                            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                                            <p className="text-base font-semibold text-slate-300">
                                                Tidak ada pengguna yang cocok
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                                Coba periksa kata kunci pencarian Anda atau tambahkan pengguna baru ke sistem.
                                            </p>
                                            <div className="mt-4">
                                                <SpecularButton
                                                    variant="primary"
                                                    size="md"
                                                    icon={Plus}
                                                    onClick={handleOpenCreate}
                                                >
                                                    Tambah Pengguna Baru
                                                </SpecularButton>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => {
                                        const isSelf = u.id === currentUserId;

                                        return (
                                            <tr
                                                key={u.id}
                                                className="hover:bg-white/[0.02] transition-colors group"
                                            >
                                                {/* Profile Name & Username */}
                                                <td className="py-3.5 px-4 min-w-[220px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-sm font-mono text-indigo-300 shrink-0">
                                                            {u.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-white flex items-center gap-2">
                                                                <span className="truncate">{u.full_name}</span>
                                                                {isSelf && (
                                                                    <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 shrink-0">
                                                                        Akun Anda
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                                                                @{u.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {getRoleBadge(u.role)}
                                                </td>

                                                {/* Status with Tactile Toggle Button */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-2 ${
                                                            isSelf
                                                                ? 'opacity-80 cursor-default bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                                                : u.is_active
                                                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer'
                                                        }`}
                                                        title={
                                                            isSelf
                                                                ? 'Status akun Anda sendiri selalu aktif'
                                                                : 'Klik untuk mengaktifkan / menonaktifkan akun staf'
                                                        }
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                                                u.is_active ? 'bg-emerald-400' : 'bg-rose-500'
                                                            }`}
                                                        />
                                                        <span>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                    </button>
                                                </td>

                                                {/* Shift Activity */}
                                                <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-300 text-sm whitespace-nowrap">
                                                    {u.cashier_shifts_count || 0} sesi
                                                </td>

                                                {/* Date created */}
                                                <td className="py-3.5 px-4 text-slate-400 text-xs font-mono whitespace-nowrap">
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(u)}
                                                            className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors flex items-center gap-1 text-xs"
                                                            title="Edit Pengguna"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span>Edit</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={isSelf}
                                                            onClick={() => handleOpenDelete(u)}
                                                            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs border ${
                                                                isSelf
                                                                    ? 'text-slate-600 border-transparent cursor-not-allowed'
                                                                    : 'bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border-white/[0.08]'
                                                            }`}
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                                            <span>Hapus</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar (Konsisten Dengan Produk) */}
                    {users.links && users.links.length > 3 && (
                        <div className="p-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                            <div>
                                Menampilkan{' '}
                                <span className="text-white font-mono font-bold">{users.data.length}</span> pengguna
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                                {users.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                                : link.url
                                                ? 'hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/[0.06]'
                                                : 'text-slate-600 cursor-not-allowed border border-transparent'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================================================
                MODAL 1: TAMBAH PENGGUNA BARU
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Pengguna Baru"
                subtitle="Buat akun untuk kasir, koki dapur, atau sesama administrator."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={createProcessing}
                            onClick={handleSubmitCreate}
                        >
                            Simpan Pengguna
                        </SpecularButton>
                    </>
                }
            >
                <form onSubmit={handleSubmitCreate} className="space-y-4">
                    <AcrylicInput
                        label="Nama Lengkap *"
                        placeholder="Contoh: Siti Nurhaliza"
                        value={createData.full_name}
                        onChange={(e) => setCreateData('full_name', e.target.value)}
                        error={createErrors.full_name}
                        required
                    />

                    <AcrylicInput
                        label="Username (Login Masuk) *"
                        placeholder="Contoh: kasir2, chef_tono"
                        value={createData.username}
                        onChange={(e) => setCreateData('username', e.target.value.toLowerCase().trim())}
                        error={createErrors.username}
                        inputClassName="font-mono text-indigo-300"
                        required
                    />

                    <div>
                        <label className="text-sm font-medium text-slate-200 block mb-2">
                            Pilih Peran Pengguna (Role) *
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {[
                                { id: 'kasir', label: 'Kasir POS' },
                                { id: 'dapur', label: 'Koki Dapur' },
                                { id: 'admin', label: 'Admin' },
                            ].map((roleOption) => (
                                <button
                                    key={roleOption.id}
                                    type="button"
                                    onClick={() => setCreateData('role', roleOption.id)}
                                    className={`min-h-[40px] px-2 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                                        createData.role === roleOption.id
                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                            : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {roleOption.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={createData.role}
                            onChange={(e) => setCreateData('role', e.target.value)}
                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            required
                        >
                            <option value="kasir">Kasir POS (Akses Terminal Order & Shift)</option>
                            <option value="dapur">Koki Dapur (Akses Kitchen Display KDS)</option>
                            <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                        </select>
                        {createErrors.role && (
                            <p className="text-xs text-rose-400 mt-1">{createErrors.role}</p>
                        )}
                    </div>

                    <AcrylicInput
                        label="Kata Sandi Login (Minimal 6 Karakter) *"
                        type="password"
                        placeholder="••••••••"
                        value={createData.password}
                        onChange={(e) => setCreateData('password', e.target.value)}
                        error={createErrors.password}
                        required
                    />

                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={createData.is_active}
                                onChange={(e) => setCreateData('is_active', e.target.checked)}
                                className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span>Akun langsung aktif dan dapat digunakan untuk masuk</span>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL 2: EDIT PENGGUNA
               ========================================================================= */}
            <AcrylicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Pengguna: ${selectedUser?.full_name || ''}`}
                subtitle="Perbarui data staf atau reset kata sandi login."
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="md"
                            loading={editProcessing}
                            onClick={handleSubmitEdit}
                        >
                            Simpan Perubahan
                        </SpecularButton>
                    </>
                }
            >
                {selectedUser && (
                    <form onSubmit={handleSubmitEdit} className="space-y-4">
                        <AcrylicInput
                            label="Nama Lengkap *"
                            value={editData.full_name}
                            onChange={(e) => setEditData('full_name', e.target.value)}
                            error={editErrors.full_name}
                            required
                        />

                        <AcrylicInput
                            label="Username (Login Masuk) *"
                            value={editData.username}
                            onChange={(e) => setEditData('username', e.target.value.toLowerCase().trim())}
                            error={editErrors.username}
                            inputClassName="font-mono text-indigo-300"
                            required
                        />

                        <div>
                            <label className="text-sm font-medium text-slate-200 block mb-2">
                                Peran Pengguna (Role) *
                            </label>
                            <select
                                value={editData.role}
                                disabled={selectedUser.id === currentUserId}
                                onChange={(e) => setEditData('role', e.target.value)}
                                className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                required
                            >
                                <option value="kasir">Kasir POS (Akses Terminal Order & Shift)</option>
                                <option value="dapur">Koki Dapur (Akses Kitchen Display KDS)</option>
                                <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                            </select>
                            {selectedUser.id === currentUserId && (
                                <p className="text-xs text-amber-300/90 mt-1">
                                    Peran akun Anda sendiri tidak dapat diubah demi keamanan sistem.
                                </p>
                            )}
                        </div>

                        <AcrylicInput
                            label="Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)"
                            type="password"
                            placeholder="Biarkan kosong jika tetap menggunakan kata sandi lama"
                            value={editData.password}
                            onChange={(e) => setEditData('password', e.target.value)}
                            error={editErrors.password}
                        />

                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                            <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-slate-200">
                                <input
                                    type="checkbox"
                                    disabled={selectedUser.id === currentUserId}
                                    checked={editData.is_active}
                                    onChange={(e) => setEditData('is_active', e.target.checked)}
                                    className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4 disabled:opacity-50"
                                />
                                <span>Status Akun Aktif (Dapat Login)</span>
                            </label>
                        </div>
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================================
                MODAL 3: KONFIRMASI HAPUS PENGGUNA
               ========================================================================= */}
            <AcrylicModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Akun Pengguna?"
                subtitle={selectedUser ? `Pengguna: ${selectedUser.full_name} (@${selectedUser.username})` : ''}
                maxWidth="max-w-md"
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="md"
                            icon={Trash2}
                            onClick={handleConfirmDelete}
                        >
                            Ya, Hapus Pengguna
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 space-y-2">
                    <div className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span>Akses Login Pengguna Akan Dicabut</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Akun <strong className="text-white">{selectedUser?.full_name}</strong> (@{selectedUser?.username}) akan dihapus dari sistem dan tidak dapat lagi masuk ke aplikasi.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Catatan transaksi dan rekonsiliasi shift yang pernah dikerjakan oleh pengguna ini tetap tersimpan aman di basis data laporan.
                    </p>
                </div>
            </AcrylicModal>
        </AdminAcrylicLayout>
    );
}
