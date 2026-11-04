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
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Admin
                    </span>
                );
            case 'kasir':
                return (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Kasir POS
                    </span>
                );
            case 'dapur':
                return (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Koki Dapur
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                        {role}
                    </span>
                );
        }
    };

    return (
        <AdminAcrylicLayout
            title="Kelola Pengguna Sistem"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onQuickSearch={(q) => triggerFilter({ search: q })}
            headerRight={
                <SpecularButton
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={handleOpenCreate}
                >
                    <span>Tambah Pengguna</span>
                </SpecularButton>
            }
        >
            <Head title="Kelola Pengguna - Kasir App Admin" />

            <div className="space-y-6">
                {/* =========================================================================
                    TOP BENTO GRID: USER ROLE METRICS
                   ========================================================================= */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Total Akun Pengguna</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.total_users}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            {metrics.active_count} akun aktif
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Administrator</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.admin_count}
                        </div>
                        <div className="text-[11px] text-indigo-400 mt-0.5 font-mono">
                            Akses penuh manajemen
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Staff Kasir POS</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.kasir_count}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                            Operator terminal pembayaran
                        </div>
                    </div>

                    <div className="p-4 bg-[#0B0D13] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                        <span className="text-xs text-slate-400 font-medium">Staff Koki / Dapur</span>
                        <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-100">
                            {metrics.dapur_count}
                        </div>
                        <div className="text-[11px] text-amber-400 mt-0.5 font-mono">
                            Operator Kitchen KDS
                        </div>
                    </div>
                </div>

                {/* =========================================================================
                    FILTER TOOLBAR
                   ========================================================================= */}
                <div className="p-3 bg-[#0B0D13] border border-white/[0.06] rounded-xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') triggerFilter({ search: e.target.value });
                                }}
                                placeholder="Cari nama atau @username..."
                                className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
                            />
                        </div>

                        {/* Role & Status Filter */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    triggerFilter({ role: e.target.value });
                                }}
                                className="bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Peran</option>
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
                                className="bg-[#07080B] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>

                            <SpecularButton
                                variant="primary"
                                size="sm"
                                icon={Plus}
                                onClick={handleOpenCreate}
                            >
                                <span>+ Tambah Pengguna</span>
                            </SpecularButton>
                        </div>
                    </div>
                </div>

                {/* =========================================================================
                    USERS DATA TABLE
                   ========================================================================= */}
                <div className="bg-[#0B0D13] border border-white/[0.06] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                                    <th className="py-3 px-4">Pengguna</th>
                                    <th className="py-3 px-4">Peran (Role)</th>
                                    <th className="py-3 px-4">Status Akun</th>
                                    <th className="py-3 px-4 text-center">Riwayat Sesi Shift</th>
                                    <th className="py-3 px-4">Terdaftar</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-500">
                                            <Users className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                                            <span className="block">Tidak ada pengguna yang cocok dengan pencarian.</span>
                                            <div className="mt-3">
                                                <SpecularButton
                                                    variant="primary"
                                                    size="sm"
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
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-bold text-xs font-mono text-slate-200">
                                                            {u.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                                                <span>{u.full_name}</span>
                                                                {isSelf && (
                                                                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                                                        Anda
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] font-mono text-slate-500">
                                                                @{u.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="py-3 px-4">
                                                    {getRoleBadge(u.role)}
                                                </td>

                                                {/* Status with minimal 6px dot & toggle */}
                                                <td className="py-3 px-4">
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                                                            isSelf
                                                                ? 'cursor-default'
                                                                : 'hover:bg-white/[0.06] cursor-pointer'
                                                        }`}
                                                        title={isSelf ? 'Anda tidak dapat mengubah status akun Anda sendiri' : 'Klik untuk mengubah status'}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                u.is_active ? 'bg-emerald-400' : 'bg-rose-500'
                                                            }`}
                                                        />
                                                        <span className="text-slate-300">
                                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                    </button>
                                                </td>

                                                {/* Shift Activity */}
                                                <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                                                    {u.cashier_shifts_count || 0} sesi
                                                </td>

                                                {/* Date created */}
                                                <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(u)}
                                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                            title="Edit Pengguna"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={isSelf}
                                                            onClick={() => handleOpenDelete(u)}
                                                            className={`p-1 rounded transition-colors ${
                                                                isSelf
                                                                    ? 'text-slate-600 cursor-not-allowed'
                                                                    : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                                            }`}
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
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

                    {/* Pagination Bar */}
                    {users.links && users.links.length > 3 && (
                        <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                            <div>
                                Menampilkan{' '}
                                <span className="text-slate-200 font-mono">{users.data.length}</span> pengguna
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                                            link.active
                                                ? 'bg-white/[0.08] text-white font-medium border border-white/[0.12]'
                                                : link.url
                                                ? 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'
                                                : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================================================
                MODAL: TAMBAH PENGGUNA BARU
               ========================================================================= */}
            <AcrylicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Pengguna Baru"
                subtitle="Buat akun untuk kasir, koki dapur, atau sesama administrator."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
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
                        label="Username (Login) *"
                        placeholder="Contoh: kasir2, chef_tono"
                        value={createData.username}
                        onChange={(e) => setCreateData('username', e.target.value)}
                        error={createErrors.username}
                        required
                    />

                    <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                            Peran Pengguna (Role) *
                        </label>
                        <select
                            value={createData.role}
                            onChange={(e) => setCreateData('role', e.target.value)}
                            className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                            required
                        >
                            <option value="kasir">Kasir POS (Akses Terminal Order & Shift)</option>
                            <option value="dapur">Koki Dapur (Akses Kitchen Display KDS)</option>
                            <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                        </select>
                        {createErrors.role && (
                            <p className="text-[11px] text-rose-400 mt-1">{createErrors.role}</p>
                        )}
                    </div>

                    <AcrylicInput
                        label="Kata Sandi (Minimal 6 Karakter) *"
                        type="password"
                        placeholder="••••••••"
                        value={createData.password}
                        onChange={(e) => setCreateData('password', e.target.value)}
                        error={createErrors.password}
                        required
                    />

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                            <input
                                type="checkbox"
                                checked={createData.is_active}
                                onChange={(e) => setCreateData('is_active', e.target.checked)}
                                className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Akun langsung aktif dan dapat digunakan untuk masuk</span>
                        </label>
                    </div>
                </form>
            </AcrylicModal>

            {/* =========================================================================
                MODAL: EDIT PENGGUNA
               ========================================================================= */}
            <AcrylicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Pengguna: ${selectedUser?.full_name || ''}`}
                subtitle="Perbarui data staf atau reset kata sandi."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="primary"
                            size="sm"
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
                            label="Username (Login) *"
                            value={editData.username}
                            onChange={(e) => setEditData('username', e.target.value)}
                            error={editErrors.username}
                            required
                        />

                        <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1">
                                Peran Pengguna (Role) *
                            </label>
                            <select
                                value={editData.role}
                                disabled={selectedUser.id === currentUserId}
                                onChange={(e) => setEditData('role', e.target.value)}
                                className="w-full bg-[#07080B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50 disabled:opacity-50"
                                required
                            >
                                <option value="kasir">Kasir POS (Akses Terminal Order & Shift)</option>
                                <option value="dapur">Koki Dapur (Akses Kitchen Display KDS)</option>
                                <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                            </select>
                            {selectedUser.id === currentUserId && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Peran akun sendiri tidak dapat diubah demi keamanan.
                                </p>
                            )}
                        </div>

                        <AcrylicInput
                            label="Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)"
                            type="password"
                            placeholder="Biarkan kosong jika tidak diubah"
                            value={editData.password}
                            onChange={(e) => setEditData('password', e.target.value)}
                            error={editErrors.password}
                        />

                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    disabled={selectedUser.id === currentUserId}
                                    checked={editData.is_active}
                                    onChange={(e) => setEditData('is_active', e.target.checked)}
                                    className="rounded bg-[#07080B] border-white/20 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 disabled:opacity-50"
                                />
                                <span>Status Akun Aktif</span>
                            </label>
                        </div>
                    </form>
                )}
            </AcrylicModal>

            {/* =========================================================================
                MODAL: KONFIRMASI HAPUS PENGGUNA
               ========================================================================= */}
            <AcrylicModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Pengguna"
                subtitle="Tindakan ini akan mencabut akses login pengguna dari sistem."
                footer={
                    <>
                        <SpecularButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </SpecularButton>
                        <SpecularButton
                            variant="danger"
                            size="sm"
                            onClick={handleConfirmDelete}
                        >
                            Ya, Hapus Pengguna
                        </SpecularButton>
                    </>
                }
            >
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        Yakin ingin menghapus akun <strong>{selectedUser?.full_name}</strong> (@{selectedUser?.username})? Riwayat transaksi atau shift yang pernah dibuat pengguna ini akan tetap tersimpan di database.
                    </div>
                </div>
            </AcrylicModal>
        </AdminAcrylicLayout>
    );
}

