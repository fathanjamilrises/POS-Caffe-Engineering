import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Shield,
    UserCheck,
    ChefHat,
    X,
    RotateCcw,
    User,
    AlertTriangle,
} from 'lucide-react';

import AdminAcrylicLayout from '@/Layouts/AdminAcrylicLayout';
import AcrylicModal from '@/Components/Acrylic/AcrylicModal';
import AcrylicInput from '@/Components/Acrylic/AcrylicInput';
import SpecularButton from '@/Components/Acrylic/SpecularButton';

/**
 * AdminUsersIndex: Elevated Staff & System User Management screen.
 * Formatted as a high-density, high-contrast Table List specifically tuned
 * for cafe/canteen staff aged 40–60 using tablet POS:
 * - Generous 60px+ row height with 40px–44px touch targets for all actions.
 * - Architectural Obsidian Ultramarine & Tanzanite palette (anti-slop, no neon glows).
 * - Clear semantic role indicators (Administrator, Kasir POS, Koki Dapur).
 * - Simple 1-tap active/inactive account toggling directly from the table row.
 * - Table-first layout with clean horizontal scrolling safety on smaller screens.
 */
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

    const handleResetFilter = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
        router.get(
            '/admin/users',
            { search: '', role: 'all', status: 'all' },
            { preserveState: true, preserveScroll: true }
        );
    };

    const isFilterActive = Boolean(searchQuery) || roleFilter !== 'all' || statusFilter !== 'all';

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
        if (e) e.preventDefault();
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
        if (e) e.preventDefault();
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
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 whitespace-nowrap inline-flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Administrator</span>
                    </span>
                );
            case 'kasir':
                return (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 whitespace-nowrap inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kasir POS</span>
                    </span>
                );
            case 'dapur':
                return (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 whitespace-nowrap inline-flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                        <span>Koki Dapur</span>
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/[0.04] text-slate-300 border border-white/[0.08] whitespace-nowrap inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">{role}</span>
                    </span>
                );
        }
    };

    return (
        <AdminAcrylicLayout
            title="Pengguna"
            showSearch={false}
        >
            <Head title="Kelola Pengguna — Kasir App Admin" />

            <div className="space-y-6">
                {/* ============================================================
                    1. HEADER CARD & ACTION CONTROLS (HIGH ERGONOMICS FOR TABLET)
                ============================================================ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm">
                    {/* Left: Icon Badge & Descriptive Title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4338CA] via-[#3730A3] to-[#1E1B4B] flex items-center justify-center border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shrink-0">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate">
                                Kelola Akun Pengguna & Staff
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium truncate mt-0.5">
                                Atur akun staf kasir, koki dapur, serta hak akses administrator sistem secara terpadu.
                            </p>
                        </div>
                    </div>

                    {/* Right: Tactile Action Button (Min 44px Height for Finger Tapping) */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <SpecularButton
                            variant="primary"
                            size="md"
                            icon={Plus}
                            onClick={handleOpenCreate}
                            title="Tambah Pengguna Baru"
                        >
                            <span>Tambah Pengguna</span>
                        </SpecularButton>
                    </div>
                </div>

                {/* ============================================================
                    2. METRIC CARDS — 4 SUMMARY METRICS DENGAN FILTER CEPAT 1-KETUK
                ============================================================ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Pengguna (Hero Tanzanite) */}
                    <button
                        type="button"
                        onClick={() => {
                            setRoleFilter('all');
                            triggerFilter({ role: 'all' });
                        }}
                        className={`p-5 rounded-2xl text-left transition-all shadow-sm flex flex-col justify-between group cursor-pointer ${
                            roleFilter === 'all'
                                ? 'bg-gradient-to-br from-[#1E1B4B]/70 via-[#141829] to-[#0C0E16] border border-indigo-500/40 ring-1 ring-indigo-500/20'
                                : 'bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                        title="Tampilkan semua pengguna"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Total Pengguna
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white tracking-tight">
                                {metrics.total_users}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                            <span className="text-slate-400">Aktif</span>
                            <span className="text-emerald-400 font-semibold font-mono">{metrics.active_count} akun</span>
                        </div>
                    </button>

                    {/* Card 2: Administrator */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = roleFilter === 'admin' ? 'all' : 'admin';
                            setRoleFilter(next);
                            triggerFilter({ role: next });
                        }}
                        className={`p-5 rounded-2xl text-left transition-all shadow-sm flex flex-col justify-between group cursor-pointer ${
                            roleFilter === 'admin'
                                ? 'bg-gradient-to-br from-indigo-950/60 via-[#141829] to-[#0C0E16] border border-indigo-400/50 ring-1 ring-indigo-500/30'
                                : 'bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                        title="Filter hanya Administrator"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Administrator
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-indigo-300 tracking-tight">
                                {metrics.admin_count}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                            <span>Manajerial</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                roleFilter === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'
                            }`}>
                                {roleFilter === 'admin' ? '✓ Terpilih' : 'Hak Penuh'}
                            </span>
                        </div>
                    </button>

                    {/* Card 3: Staff Kasir POS */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = roleFilter === 'kasir' ? 'all' : 'kasir';
                            setRoleFilter(next);
                            triggerFilter({ role: next });
                        }}
                        className={`p-5 rounded-2xl text-left transition-all shadow-sm flex flex-col justify-between group cursor-pointer ${
                            roleFilter === 'kasir'
                                ? 'bg-gradient-to-br from-emerald-950/40 via-[#0F1D1B] to-[#0C0E16] border border-emerald-500/50 ring-1 ring-emerald-500/30'
                                : 'bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                        title="Filter hanya Staff Kasir"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Kasir POS
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-400 tracking-tight">
                                {metrics.kasir_count}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                            <span>Front POS</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                roleFilter === 'kasir' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                            }`}>
                                {roleFilter === 'kasir' ? '✓ Terpilih' : 'Kasir & Shift'}
                            </span>
                        </div>
                    </button>

                    {/* Card 4: Staff Koki Dapur */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = roleFilter === 'dapur' ? 'all' : 'dapur';
                            setRoleFilter(next);
                            triggerFilter({ role: next });
                        }}
                        className={`p-5 rounded-2xl text-left transition-all shadow-sm flex flex-col justify-between group cursor-pointer ${
                            roleFilter === 'dapur'
                                ? 'bg-gradient-to-br from-amber-950/40 via-[#1C160F] to-[#0C0E16] border border-amber-500/50 ring-1 ring-amber-500/30'
                                : 'bg-[#0C0E16] border border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                        title="Filter hanya Koki Dapur"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Koki Dapur
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                    <ChefHat className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-400 tracking-tight">
                                {metrics.dapur_count}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                            <span>KDS Dapur</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                roleFilter === 'dapur' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                            }`}>
                                {roleFilter === 'dapur' ? '✓ Terpilih' : 'Display KDS'}
                            </span>
                        </div>
                    </button>
                </section>

                {/* ============================================================
                    3. FILTER & PENCARIAN (ERGONOMIS DENGAN TOUCH TARGET BESAR)
                ============================================================ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search Input with Clear Button */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') triggerFilter({ search: e.target.value });
                            }}
                            placeholder="Cari nama staf atau @username..."
                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] focus:border-indigo-500 rounded-xl pl-10 pr-9 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    triggerFilter({ search: '' });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                                title="Hapus pencarian"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns + Reset */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                triggerFilter({ role: e.target.value });
                            }}
                            className="h-11 bg-[#08090D] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-slate-200 focus:outline-none transition-colors"
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
                            className="h-11 bg-[#08090D] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-slate-200 focus:outline-none transition-colors"
                        >
                            <option value="all">Semua Status Akun</option>
                            <option value="active">Status Aktif</option>
                            <option value="inactive">Status Nonaktif</option>
                        </select>

                        {/* Reset Filter Button */}
                        {isFilterActive && (
                            <button
                                type="button"
                                onClick={handleResetFilter}
                                className="h-11 px-3.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors active:scale-95"
                                title="Reset filter dan pencarian"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ============================================================
                    4. TABEL PENGGUNA (HIGH CONTRAST & TOUCH FRIENDLY 60PX+)
                ============================================================ */}
                <div className="rounded-2xl bg-[#0C0E16] border border-white/[0.08] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 min-w-[850px]">
                            <thead className="bg-[#090A10] text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
                                <tr>
                                    <th className="py-4 px-4 sm:px-5 whitespace-nowrap min-w-[240px]">
                                        Profil Pengguna
                                    </th>
                                    <th className="py-4 px-4 whitespace-nowrap w-[170px]">
                                        Peran (Role)
                                    </th>
                                    <th className="py-4 px-4 whitespace-nowrap w-[150px]">
                                        Status Akun
                                    </th>
                                    <th className="py-4 px-4 text-center whitespace-nowrap w-[150px]">
                                        Aktivitas Shift
                                    </th>
                                    <th className="py-4 px-4 whitespace-nowrap w-[140px]">
                                        Terdaftar
                                    </th>
                                    <th className="py-4 px-4 sm:px-5 text-right whitespace-nowrap w-[160px]">
                                        Tindakan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                                                    Tidak ada pengguna yang cocok
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                                    Coba periksa kata kunci pencarian atau sesuaikan filter yang sedang aktif.
                                                </p>
                                                {isFilterActive && (
                                                    <button
                                                        type="button"
                                                        onClick={handleResetFilter}
                                                        className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl transition-colors active:scale-95"
                                                    >
                                                        Bersihkan Filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => {
                                        const isSelf = u.id === currentUserId;
                                        const initial = u.full_name?.substring(0, 2).toUpperCase() || 'US';

                                        return (
                                            <tr key={u.id} className="hover:bg-white/[0.025] transition-colors group">
                                                {/* Profile Name & Username */}
                                                <td className="py-4 px-4 sm:px-5 min-w-[240px]">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#312E81] via-[#1E1B4B] to-[#0F172A] border border-indigo-400/25 flex items-center justify-center font-bold text-sm font-mono text-indigo-200 shadow-sm shrink-0">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2 tracking-tight">
                                                                <span className="truncate">{u.full_name}</span>
                                                                {isSelf && (
                                                                    <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 font-semibold shrink-0">
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
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {getRoleBadge(u.role)}
                                                </td>

                                                {/* Status with Tactile Toggle Button */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-2 active:scale-95 ${
                                                            isSelf
                                                                ? 'opacity-80 cursor-default bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                                                : u.is_active
                                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25 cursor-pointer shadow-sm'
                                                                : 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500/25 cursor-pointer shadow-sm'
                                                        }`}
                                                        title={
                                                            isSelf
                                                                ? 'Status akun Anda sendiri selalu aktif'
                                                                : 'Ketuk untuk mengaktifkan / menonaktifkan akun staf'
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
                                                <td className="py-4 px-4 text-center font-mono tabular-nums text-slate-300 text-sm font-semibold whitespace-nowrap">
                                                    {u.cashier_shifts_count || 0} sesi
                                                </td>

                                                {/* Date created */}
                                                <td className="py-4 px-4 text-slate-400 text-xs font-mono whitespace-nowrap">
                                                    {u.created_at
                                                        ? new Date(u.created_at).toLocaleDateString('id-ID', {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          })
                                                        : '-'}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 sm:px-5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(u)}
                                                            className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors flex items-center gap-1.5 text-xs font-semibold active:scale-95"
                                                            title="Edit data pengguna"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span>Edit</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={isSelf}
                                                            onClick={() => handleOpenDelete(u)}
                                                            className={`h-9 w-9 rounded-lg transition-colors flex items-center justify-center text-xs border active:scale-95 ${
                                                                isSelf
                                                                    ? 'text-slate-600 border-transparent cursor-not-allowed opacity-40'
                                                                    : 'bg-white/[0.02] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border-white/[0.06] hover:border-rose-500/30'
                                                            }`}
                                                            title={
                                                                isSelf
                                                                    ? 'Tidak dapat menghapus akun sendiri'
                                                                    : 'Hapus pengguna'
                                                            }
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
                        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0A0C14] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
                            <div>
                                Menampilkan{' '}
                                <span className="font-mono text-slate-200 font-semibold">{users.from || 0}</span> –{' '}
                                <span className="font-mono text-slate-200 font-semibold">{users.to || 0}</span> dari{' '}
                                <span className="font-mono text-slate-200 font-semibold">{users.total || 0}</span> pengguna
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {users.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`min-h-[38px] min-w-[38px] px-3 py-1 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                                            link.active
                                                ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                                                : link.url
                                                ? 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06]'
                                                : 'text-slate-600 bg-transparent cursor-not-allowed opacity-50'
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
                        <label className="text-sm font-semibold text-slate-200 block mb-2">
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
                                    className={`min-h-[44px] px-2 py-2 text-xs font-bold rounded-xl border transition-all text-center active:scale-95 ${
                                        createData.role === roleOption.id
                                            ? 'bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white border-indigo-400/40 shadow-sm'
                                            : 'bg-[#08090D] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {roleOption.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={createData.role}
                            onChange={(e) => setCreateData('role', e.target.value)}
                            className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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
                                className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
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
                            <label className="text-sm font-semibold text-slate-200 block mb-2">
                                Peran Pengguna (Role) *
                            </label>
                            <select
                                value={editData.role}
                                disabled={selectedUser.id === currentUserId}
                                onChange={(e) => setEditData('role', e.target.value)}
                                className="w-full h-11 bg-[#08090D] border border-white/[0.08] rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                required
                            >
                                <option value="kasir">Kasir POS (Akses Terminal Order & Shift)</option>
                                <option value="dapur">Koki Dapur (Akses Kitchen Display KDS)</option>
                                <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
                            </select>
                            {selectedUser.id === currentUserId && (
                                <p className="text-xs text-amber-300/90 mt-1 font-medium">
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
                                    className="rounded bg-[#08090D] border-white/20 text-indigo-600 focus:ring-indigo-500 w-5 h-5 disabled:opacity-50"
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
