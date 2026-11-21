import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import ThemeToggle from '@/Components/Theme/ThemeToggle';
import { useTheme } from '@/Hooks/useTheme';
import {
    playScannerBeep,
    playCartBeep,
    playKitchenAlertBell,
} from '@/Services/audio';
import {
    Store,
    QrCode,
    UtensilsCrossed,
    ChefHat,
    LayoutDashboard,
    ScanLine,
    DollarSign,
    SlidersHorizontal,
    FileSpreadsheet,
    Shield,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Lock,
    ExternalLink,
    Play,
    Volume2,
    ChevronDown,
} from 'lucide-react';

/* =========================================================================
   ARCHITECTURAL CONTOUR & SUBTLE MESH BACKGROUND (CANVAS)
   High-performance, restrained ambient canvas that adapts to light/dark themes.
   Supports prefers-reduced-motion for complete accessibility.
   ========================================================================= */
function ArchitecturalCanvas({ isDark, scrollY }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            targetMouseX = (e.clientX - width / 2) * 0.03;
            targetMouseY = (e.clientY - height / 2) * 0.03;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        const ribbonCount = 4;
        const segmentCount = 32;
        let time = 0;

        const render = () => {
            time += 0.005;
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            ctx.clearRect(0, 0, width, height);

            const centerX = width * 0.5;
            const centerY = height * 0.42;
            const fov = 340;

            for (let r = 0; r < ribbonCount; r++) {
                const ribbonOffset = (r - (ribbonCount - 1) / 2) * 65;
                const points = [];

                for (let s = 0; s <= segmentCount; s++) {
                    const u = s / segmentCount;
                    const z = 120 + u * 1050;

                    const wave1 = Math.sin(u * 3.8 - time * 0.5 + r * 0.35) * 24;
                    const wave2 = Math.cos(u * 2.4 + time * 0.3 - r * 0.25) * 14;

                    const x = (u - 0.5) * 1500 + ribbonOffset * 2.0 + mouseX * (1 - u * 0.4);
                    const y = wave1 + wave2 + (r - 1.5) * 24 + mouseY * (1 - u * 0.3);

                    const scale = fov / (z + 240);
                    const projX = centerX + x * scale;
                    const projY = centerY + y * scale;

                    points.push({ x: projX, y: projY });
                }

                if (points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);

                    for (let i = 1; i < points.length - 1; i++) {
                        const xc = (points[i].x + points[i + 1].x) / 2;
                        const yc = (points[i].y + points[i + 1].y) / 2;
                        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                    }
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

                    const alpha = isDark
                        ? Math.max(0.04, 0.14 - (r / ribbonCount) * 0.05)
                        : Math.max(0.03, 0.09 - (r / ribbonCount) * 0.03);

                    ctx.strokeStyle = isDark
                        ? `rgba(99, 102, 241, ${alpha})`
                        : `rgba(67, 56, 202, ${alpha})`;
                    ctx.lineWidth = r === 1 ? 1.4 : 0.8;
                    ctx.stroke();
                }
            }

            if (!prefersReducedMotion) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isDark]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-60 dark:opacity-40 transition-opacity duration-500"
            style={{ transform: `translate3d(0, ${scrollY * -0.04}px, 0)` }}
            aria-hidden="true"
        />
    );
}

/* =========================================================================
   MAIN PROMOTIONAL LANDING PAGE (WELCOME)
   ========================================================================= */
export default function Welcome({ sample_table_token = null, sample_table_number = 'Meja 1' }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Global Scroll & Parallax Tracking
    const [scrollY, setScrollY] = useState(0);
    const [scrollPercent, setScrollPercent] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setScrollY(currentY);
            setIsScrolled(currentY > 20);

            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (currentY / docHeight) * 100 : 0;
            setScrollPercent(Math.min(100, Math.max(0, progress)));

            // Snap indicator tracking
            const sections = ['hero', 'flow', 'features', 'roles', 'portal'];
            for (const sec of sections) {
                const el = document.getElementById(sec);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 240 && rect.bottom >= 240) {
                        setActiveSection(sec);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Interactive Real-Time Flow Simulation State
    const [simulatedToken, setSimulatedToken] = useState(42);
    const [simulatedStep, setSimulatedStep] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationProgress, setSimulationProgress] = useState(0);

    // Interactive Step for Section 2 (Alur Sistem)
    const [activeFlowStep, setActiveFlowStep] = useState(0);

    // Interactive Role Matrix for Section 4
    const [selectedRole, setSelectedRole] = useState('admin');

    // Trigger smooth interactive simulation with genuine acoustic feedback
    const triggerSimulation = useCallback(() => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimulatedStep(1);
        setSimulationProgress(15);
        playCartBeep();

        const t1 = setTimeout(() => {
            setSimulatedStep(2);
            setSimulationProgress(55);
            playScannerBeep();
        }, 900);

        const t2 = setTimeout(() => {
            setSimulatedStep(3);
            setSimulationProgress(90);
            playKitchenAlertBell();
        }, 1800);

        const t3 = setTimeout(() => {
            setSimulationProgress(100);
            setSimulatedToken((prev) => prev + 1);
        }, 2700);

        const t4 = setTimeout(() => {
            setIsSimulating(false);
            setSimulatedStep(0);
            setSimulationProgress(0);
        }, 3600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [isSimulating]);

    // Flow Pipeline Steps Definition (No AI slop buzzwords, pure operational clarity)
    const flowSteps = [
        {
            num: '01',
            badge: 'Pemesanan Mandiri',
            title: 'Scan QR Meja atau Input Kasir Walk-In',
            desc: 'Pelanggan memesan mandiri langsung dari meja via stiker QR tanpa perlu mengantre. Kasir juga dapat menginput pesanan walk-in dengan cepat melalui katalog sentuh atau pemindai barcode USB/Bluetooth.',
            specs: ['QR Token Generator Unik', 'Hardware Barcode Listener', 'Tanpa Antrean Menumpuk'],
        },
        {
            num: '02',
            badge: 'Perutean Otomatis',
            title: 'Pemisahan Pesanan Instan vs Menu Olahan Dapur',
            desc: 'Sistem secara otomatis membedakan item pesanan. Minuman dan camilan langsung mengurangi stok dan selesai di kasir, sedangkan makanan olahan kompor dialirkan ke layar antrean dapur.',
            specs: ['Transaksi Basis Data Atomik', 'Flag requires_kitchen Otomatis', 'Pemisahan Tiket Real-Time'],
        },
        {
            num: '03',
            badge: 'Notifikasi Akustik',
            title: 'Alarm Suara Lonceng dan Timer Antrean Dapur',
            desc: 'Koki tidak perlu memantau layar tanpa jeda. Layar KDS membunyikan lonceng pesanan masuk berbasis Web Audio API dan menampilkan timer durasi masak dengan indikator visual keterlambatan.',
            specs: ['Web Audio API 100% Offline', 'Timer Masak Real-Time', 'Visual Merah Berkedip >20 Mnt'],
        },
        {
            num: '04',
            badge: 'Serah Terima Rapi',
            title: 'Dua Tahap Penyajian dan Konfirmasi Kasir',
            desc: 'Koki menandai masakan siap saji, lalu mengantarkannya ke konter kasir. Kasir memanggil nomor token pelanggan atau mengantar ke meja, kemudian menekan tombol konfirmasi selesai.',
            specs: ['Handshake Dua Tahap', 'Pelacakan Status Pesanan', 'Audit Waktu Pelayanan'],
        },
    ];

    // Role Matrix Data Definition
    const roleData = {
        admin: {
            title: 'Administrator Eksekutif',
            tagline: 'Kendali Penuh Inventaris, Pembukuan Laba Bersih dan Hak Akses Staf',
            portal: '/admin',
            badgeColor: 'border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10',
            capabilities: [
                'Ringkasan Finansial Real-Time: Total Omzet, Modal HPP, Beban Operasional dan Laba Bersih akurat.',
                'Katalog Menu dan Penyesuaian Stok: Pencatatan mutasi barang masuk (+), keluar (-), dan opname fisik (~).',
                'Rekapitulasi Shift Kasir: Rekonsiliasi modal kas awal, penjualan tunai, transaksi QRIS, dan selisih fisik.',
                'Manajemen Pengguna: Pembuatan akun staf, penetapan hak akses peran, dan modal reset kata sandi.',
                'Ekspor Laporan Resmi: Unduh file CSV spreadsheet dan cetak laporan eksekutif PDF siap audit.',
            ],
            restrictions: [
                'Tidak diperuntukkan untuk memproses operasional tiket memasak harian di dapur.',
            ],
        },
        kasir: {
            title: 'Kasir POS Terminal',
            tagline: 'Terminal Transaksi Cepat, Hardware Barcode Scanner dan Validasi Pembayaran',
            portal: '/pos',
            badgeColor: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
            capabilities: [
                'Manajemen Sesi Shift: Input modal kas awal laci dan pencatatan kas aktual saat penutupan shift.',
                'Hardware Barcode Scanner: Deteksi otomatis pemindaian untuk memasukkan item langsung ke keranjang.',
                'Perhitungan Pembayaran Otomatis: Validasi nominal tunai, proteksi kurang bayar, dan kalkulasi kembalian.',
                'Mode Fleksibel: Pilihan Makan di Tempat (Bebas Duduk) atau Pesanan Bungkus (Bawa Pulang).',
                'Pintasan Keyboard (F1 s/d F10): Operasional keyboard-first untuk kecepatan antrean kasir.',
            ],
            restrictions: [
                'Tidak dapat mengubah harga modal HPP produk atau mengedit data hak akses akun staf lain.',
            ],
        },
        dapur: {
            title: 'Koki Dapur (Kitchen KDS)',
            tagline: 'Layar Antrean Tiket Kontras Tinggi dengan Alarm Suara dan Timer Masak',
            portal: '/kitchen',
            badgeColor: 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
            capabilities: [
                'Antrean Kontras Tinggi: Kartu tiket dengan nomor token besar yang terbaca jelas dari jarak dua meter.',
                'Filter Stasiun Masak: Pemilahan tiket berdasarkan Stasiun Makanan, Minuman, atau Camilan.',
                'Alarm Lonceng Otomatis: Bunyi lonceng Web Audio API instan saat ada tiket masuk dan tombol uji bel.',
                'Timer Durasi Memasak: Indikator waktu real-time dengan status normal, amber, dan peringatan merah berkedip.',
                'Alur Kerja Satu Sentuhan: Perubahan status dari Menunggu ke Sedang Dimasak hingga Diantar ke Kasir.',
            ],
            restrictions: [
                'Tidak memiliki akses ke laporan pembukuan finansial, master harga modal, atau saldo kas kasir.',
            ],
        },
        pelanggan: {
            title: 'Pelanggan Meja (QR Self-Order)',
            tagline: 'Pemesanan Mandiri Tanpa Aplikasi, Cukup Pindai QR di Atas Meja',
            portal: sample_table_token ? `/table/${sample_table_token}` : '/table/demo',
            badgeColor: 'border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10',
            capabilities: [
                'Pemesanan Mandiri Langsung: Cukup buka kamera ponsel dan pindai stiker QR di atas meja makan.',
                'Katalog Menu Interaktif: Filter kategori produk, foto, harga, dan penanda otomatis menu habis.',
                'Catatan Khusus Koki: Menambahkan instruksi penyajian (misalnya: tidak pedas atau es sedikit).',
                'Fitur Bantuan Meja: Tombol panggil pelayan untuk meminta alat makan, pembersihan meja, atau nota.',
                'Pelacakan Antrean Real-Time: Pemantauan nomor token dan status progres pesanan langsung dari ponsel.',
            ],
            restrictions: [
                'Tidak dapat mengakses dasbor operasional internal, data antrean meja lain, atau pengaturan toko.',
            ],
        },
    };

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#06070A] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200 antialiased overflow-x-hidden transition-colors duration-300 scroll-smooth">
            <Head title="Kasir App - Sistem POS Kasir, Dapur KDS & QR Meja Kantin" />

            {/* Top Global Animated Scroll Progress Bar */}
            <div
                className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 z-[100] transition-all duration-75 ease-out shadow-xs pointer-events-none"
                style={{ width: `${scrollPercent}%` }}
                aria-hidden="true"
            />

            {/* Architectural Canvas Background with Smooth Scroll Parallax */}
            <ArchitecturalCanvas isDark={isDark} scrollY={scrollY} />

            {/* Floating Side Section Quick Navigation Rail (Desktop Only) */}
            <nav
                aria-label="Navigasi Halaman Cepat"
                className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-center gap-3.5 p-2 rounded-full bg-white/90 dark:bg-[#0B0D13]/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.12] shadow-xl shadow-slate-900/10 dark:shadow-black/60"
            >
                {[
                    { id: 'hero', label: '01 Ringkasan' },
                    { id: 'flow', label: '02 Alur Sistem' },
                    { id: 'features', label: '03 Fitur Utama' },
                    { id: 'roles', label: '04 Hak Akses' },
                    { id: 'portal', label: '05 Portal Cepat' },
                ].map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className="group relative flex items-center justify-center p-1.5 focus:outline-hidden"
                            aria-label={`Pindah ke ${item.label}`}
                        >
                            <span className="absolute right-8 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-white bg-slate-900 dark:bg-slate-800 border border-white/10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {item.label}
                            </span>
                            <span
                                className={`block rounded-full transition-all duration-300 ${
                                    isActive
                                        ? 'w-2.5 h-6 bg-indigo-600 dark:bg-indigo-400 shadow-sm shadow-indigo-500/50'
                                        : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-400'
                                }`}
                            />
                        </a>
                    );
                })}
            </nav>

            {/* Subtle Ambient Radial Lighting */}
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-20 transition-transform duration-300"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 35% at 50% -5%, rgba(67, 56, 202, 0.22), transparent 70%)',
                    transform: `translate3d(0, ${scrollY * -0.02}px, 0)`,
                }}
            />

            {/* =========================================================================
                FIXED NAVBAR WITH DYNAMIC FROSTED GLASSMORPHY ANIMATION
                ========================================================================= */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out ${
                    isScrolled
                        ? 'h-16 bg-white/80 dark:bg-[#06070A]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-lg shadow-slate-900/5 dark:shadow-black/50'
                        : 'h-20 bg-transparent backdrop-blur-xs border-b border-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between gap-4">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center text-white shadow-xs border border-indigo-400/30">
                            <Store className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                                KASIR APP
                            </span>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-white/[0.05] border border-indigo-200 dark:border-white/[0.08]">
                                POS & KDS v2.4
                            </span>
                        </div>
                    </div>

                    {/* Navigation Anchors with Clean Snap Target */}
                    <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <a
                            href="#hero"
                            className={`transition-colors ${activeSection === 'hero' ? 'text-indigo-600 dark:text-white font-bold' : 'hover:text-indigo-600 dark:hover:text-white'}`}
                        >
                            Ringkasan
                        </a>
                        <a
                            href="#flow"
                            className={`transition-colors ${activeSection === 'flow' ? 'text-indigo-600 dark:text-white font-bold' : 'hover:text-indigo-600 dark:hover:text-white'}`}
                        >
                            Alur Sistem
                        </a>
                        <a
                            href="#features"
                            className={`transition-colors ${activeSection === 'features' ? 'text-indigo-600 dark:text-white font-bold' : 'hover:text-indigo-600 dark:hover:text-white'}`}
                        >
                            Fitur Utama
                        </a>
                        <a
                            href="#roles"
                            className={`transition-colors ${activeSection === 'roles' ? 'text-indigo-600 dark:text-white font-bold' : 'hover:text-indigo-600 dark:hover:text-white'}`}
                        >
                            Hak Akses
                        </a>
                    </nav>

                    {/* Action Buttons & Theme Switcher */}
                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />

                        <Link
                            href="/pos"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-colors"
                        >
                            <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Demo POS</span>
                        </Link>

                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] border border-indigo-500/30 transition-all active:scale-[0.98]"
                        >
                            <span>Masuk Sistem</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                SECTION 01: HERO & INTERACTIVE OPERATIONAL FLOW SCHEMATIC
                Has generous pt-28 sm:pt-36 to avoid overlapping with fixed navbar
                ========================================================================= */}
            <section id="hero" className="relative z-10 pt-28 sm:pt-36 pb-20 px-4 sm:px-8 lg:px-12 scroll-mt-24">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Header Headline */}
                    <div className="text-center max-w-4xl mx-auto space-y-4">
                        {/* Status Pill */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-400/25 text-xs font-mono font-medium text-indigo-700 dark:text-indigo-300 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                            <span>SISTEM OPERASIONAL KANTIN: MEJA QR, KASIR POS & DAPUR KDS</span>
                        </div>

                        {/* H1 Main Heading */}
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                            Operasional Kasir dan Dapur Kantin{' '}
                            <span className="text-indigo-600 dark:text-indigo-400 block sm:inline">
                                Tanpa Antre, Tanpa Salah Catat.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Ekosistem terpadu untuk kafe dan kantin modern: Pemesanan mandiri via QR Meja, terminal kasir
                            dengan pemindai barcode hardware, monitor dapur KDS berdering otomatis, dan pembukuan laba bersih harian.
                        </p>

                        {/* Primary CTAs */}
                        <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                            <Link
                                href="/pos"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_8px_rgba(30,27,75,0.25)] border border-indigo-500/30 transition-all active:scale-[0.98]"
                            >
                                <UtensilsCrossed className="w-4 h-4" />
                                <span>Buka Terminal Kasir</span>
                            </Link>

                            {sample_table_token ? (
                                <Link
                                    href={`/table/${sample_table_token}`}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#0B0D13] hover:bg-slate-50 dark:hover:bg-[#121520] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] shadow-xs transition-colors"
                                >
                                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Simulasi Menu QR ({sample_table_number})</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#0B0D13] hover:bg-slate-50 dark:hover:bg-[#121520] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] shadow-xs transition-colors"
                                >
                                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Masuk Portal Manajemen</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* =========================================================================
                        INTERACTIVE OPERATIONAL PIPELINE SCHEMATIC (SMOOTH & INTEGRATED)
                        With gentle parallax translation
                        ========================================================================= */}
                    <div
                        className="mt-12 max-w-5xl mx-auto transition-transform duration-200 ease-out"
                        style={{ transform: `translate3d(0, ${Math.min(scrollY * 0.04, 25)}px, 0)` }}
                    >
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-[#0B0D13]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] shadow-md shadow-slate-900/5 space-y-5">
                            {/* Card Header & Simulation Trigger Button */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                    <span className="text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                                        SIMULASI ALIRAN TRANSAKSI REAL-TIME
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={triggerSimulation}
                                    disabled={isSimulating}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-indigo-50 dark:bg-white/[0.04] hover:bg-indigo-100 dark:hover:bg-white/[0.08] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-white/[0.08] transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
                                >
                                    <Play className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSimulating ? 'opacity-50' : ''}`} />
                                    <span>{isSimulating ? 'Memproses Alur Pesanan...' : 'Picu Simulasi Pesanan'}</span>
                                </button>
                            </div>

                            {/* Continuous Fluid Flow Progress Track */}
                            <div className="relative w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${simulationProgress}%` }}
                                />
                            </div>

                            {/* Three Interconnected Schematic Nodes */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {/* Node 1: Meja QR */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 1
                                            ? 'bg-indigo-50/80 dark:bg-[#12162A] border-indigo-400/60 ring-2 ring-indigo-400/30 shadow-md'
                                            : 'bg-slate-50/70 dark:bg-[#08090D] border-slate-200 dark:border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                <span>TAHAP 1: MEJA QR</span>
                                            </span>
                                            <span className="text-indigo-600 dark:text-indigo-300 font-bold">#Meja 4</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Pesanan Masuk via QR HP
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                                            2x Nasi Goreng + 2x Es Teh
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Status Meja:</span>
                                        <span className={`font-semibold ${simulatedStep >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            {simulatedStep >= 1 ? 'Terkirim (14ms)' : 'Siap'}
                                        </span>
                                    </div>
                                </div>

                                {/* Node 2: Kasir POS */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 2
                                            ? 'bg-emerald-50/80 dark:bg-[#121E20] border-emerald-400/60 ring-2 ring-emerald-400/30 shadow-md'
                                            : 'bg-slate-50/70 dark:bg-[#08090D] border-slate-200 dark:border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span>TAHAP 2: KASIR POS</span>
                                            </span>
                                            <span className="text-emerald-600 dark:text-emerald-300 font-bold">POS</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Validasi Kasir & Cetak Struk
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                                            Pembayaran Tunai Rp 60.000 (Pas)
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Nomor Token:</span>
                                        <span className={`font-bold ${simulatedStep >= 2 ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`}>
                                            #{simulatedToken}
                                        </span>
                                    </div>
                                </div>

                                {/* Node 3: Dapur KDS */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 3
                                            ? 'bg-amber-50/80 dark:bg-[#1D1714] border-amber-400/60 ring-2 ring-amber-400/30 shadow-md'
                                            : 'bg-slate-50/70 dark:bg-[#08090D] border-slate-200 dark:border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                <span>TAHAP 3: DAPUR KDS</span>
                                            </span>
                                            <span className="text-amber-600 dark:text-amber-300 font-bold">KDS</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>Lonceng Suara Dapur</span>
                                            <Volume2 className={`w-3.5 h-3.5 ${simulatedStep === 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                                            Tiket Masak: 2x Nasi Goreng
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Timer Masak:</span>
                                        <span className={`font-bold ${simulatedStep === 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                            {simulatedStep === 3 ? '00:08 (Memasak)' : 'Antrean Bersih'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 02: END-TO-END OPERATIONAL FLOW PIPELINE
                ========================================================================= */}
            <section id="flow" className="relative z-10 py-20 sm:py-24 px-4 sm:px-8 lg:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#07080D] scroll-mt-24">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-indigo-700 dark:text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>02 / ALUR SISTEM OPERASIONAL</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                            Menghilangkan Kebiasaan Kasir Bolak-Balik ke Dapur.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Alur pesanan terarah yang memangkas waktu tunggu pelanggan. Tanpa nota kertas yang tercecer,
                            tanpa salah catat pesanan, dan tanpa antrean menumpuk di depan meja kasir.
                        </p>
                    </div>

                    {/* Stepped Pipeline 4-Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {flowSteps.map((step, idx) => {
                            const isSelected = activeFlowStep === idx;
                            return (
                                <div
                                    key={step.num}
                                    onClick={() => setActiveFlowStep(idx)}
                                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 select-none flex flex-col justify-between min-h-[260px] hover:-translate-y-1 ${
                                        isSelected
                                            ? 'bg-white dark:bg-[#0B0D13] border-indigo-400/60 ring-2 ring-indigo-400/20 shadow-md'
                                            : 'bg-white/70 dark:bg-[#08090D] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] hover:bg-white dark:hover:bg-[#0B0D13]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono mb-3">
                                            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-200">
                                                {step.num}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                                                {step.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-1">
                                        {step.specs.map((spec, i) => (
                                            <div
                                                key={i}
                                                className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300/80 truncate flex items-center gap-1.5"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span>{spec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interactive Flow Detail Spotlight Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                {flowSteps[activeFlowStep].num}
                            </div>
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 block">
                                    Tahap Terpilih: {flowSteps[activeFlowStep].title}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                                    Status: Terintegrasi dan Terverifikasi
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveFlowStep((prev) => (prev > 0 ? prev - 1 : flowSteps.length - 1))
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                            >
                                Sebelumnya
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveFlowStep((prev) => (prev < flowSteps.length - 1 ? prev + 1 : 0))
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 03: CORE TECHNICAL FEATURES (BENTO GRID)
                ========================================================================= */}
            <section id="features" className="relative z-10 py-20 sm:py-24 px-4 sm:px-8 lg:px-12 border-t border-slate-200 dark:border-white/[0.06] scroll-mt-24">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-indigo-700 dark:text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>03 / FITUR TEKNIS UNGGULAN</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                            Perangkat Keras, Pembukuan dan Inventaris yang Sinkron.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Dirancang untuk ketahanan operasional ritel makanan: kalkulasi tanpa selisih,
                            proteksi kurang bayar, dan pemindaian barcode fisik.
                        </p>
                    </div>

                    {/* Bento Grid: 4 Core Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Feature 1: Dual-Mode Barcode Scanner */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 text-sm">
                                        <ScanLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>Dukungan Hardware Barcode Scanner</span>
                                    </span>
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                        Keyboard-Wedge Ready
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Mendengarkan input tembakan scanner secara global tanpa perlu mengklik kolom pencarian.
                                    Di Kasir otomatis memasukkan item ke keranjang dan menghitung total; di Admin otomatis memfilter menu
                                    dan membuka formulir stok barang.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Scan Barcode:</span>
                                <span className="text-indigo-700 dark:text-indigo-300 font-bold">8991002340 (Auto Add Cart)</span>
                            </div>
                        </div>

                        {/* Feature 2: Smart Payment & Underpayment Guard */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 text-sm">
                                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Proteksi Pembayaran & Hitung Kembalian</span>
                                    </span>
                                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                                        Tunai & QRIS
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Secara ketat memblokir transaksi jika uang fisik diterima kurang dari total tagihan
                                    belanja dengan peringatan visual. Uang kembalian dihitung secara instan dengan presisi
                                    matematis untuk menjaga integritas kasir.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Uang Diterima &gt;= Total:</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Kembalian: Rp 15.000 (Pass)</span>
                            </div>
                        </div>

                        {/* Feature 3: Auto-Lock Menu Habis */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 text-sm">
                                        <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        <span>Kunci Otomatis Menu Habis (Stok 0)</span>
                                    </span>
                                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                                        Zero Overbooking
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Begitu stok menu mencapai angka 0 atau dinonaktifkan di dasbor admin, sistem secara
                                    otomatis mengunci produk tersebut di katalog Kasir dan QR Pelanggan dengan tanda
                                    Habis, mencegah pelanggan memesan menu yang bahannya sudah kosong.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Kondisi Stok &lt;= 0:</span>
                                <span className="text-rose-700 dark:text-rose-400 font-bold inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Terkunci Otomatis (Habis)</span>
                                </span>
                            </div>
                        </div>

                        {/* Feature 4: Real-Time Profit & Loss (Laba Rugi) */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 text-sm">
                                        <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span>Kalkulasi Laba Bersih & Ekspor Resmi</span>
                                    </span>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                                        PDF & CSV
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Setiap baris transaksi merekam snapshot harga modal (HPP) dan harga jual saat transaksi
                                    berlangsung. Laba bersih dihitung transparan: Total Omzet dikurangi HPP dan Beban Operasional,
                                    siap diunduh untuk laporan manajerial.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Rumus Laba Bersih:</span>
                                <span className="text-indigo-700 dark:text-indigo-300 font-bold">Omzet - (HPP + Beban)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 04: ROLE & ACCESS CONTROL MATRIX
                ========================================================================= */}
            <section id="roles" className="relative z-10 py-20 sm:py-24 px-4 sm:px-8 lg:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#07080D] scroll-mt-24">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-indigo-700 dark:text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>04 / MATRIKS PERAN & HAK AKSES</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                            Hak Akses Terpisah Sesuai Tanggung Jawab Operasional.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Setiap peran pengguna disajikan antarmuka ergonomis yang disesuaikan dengan alur kerjanya,
                            menjaga kerahasiaan data laba dan meminimalkan kesalahan staf.
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 select-none">
                        {[
                            { id: 'admin', label: '1. Role Administrator', icon: LayoutDashboard },
                            { id: 'kasir', label: '2. Role Kasir POS', icon: UtensilsCrossed },
                            { id: 'dapur', label: '3. Role Koki Dapur (KDS)', icon: ChefHat },
                            { id: 'pelanggan', label: '4. Pelanggan (QR Meja)', icon: QrCode },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedRole === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedRole(tab.id)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? 'bg-white dark:bg-white/[0.09] text-indigo-700 dark:text-white border border-indigo-200 dark:border-white/[0.14] shadow-xs'
                                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/[0.06]'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Role Matrix Card */}
                    <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-6">
                        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {roleData[selectedRole].title}
                                    </h3>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${roleData[selectedRole].badgeColor}`}
                                    >
                                        Portal: {roleData[selectedRole].portal}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {roleData[selectedRole].tagline}
                                </p>
                            </div>

                            <Link
                                href={roleData[selectedRole].portal}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] transition-colors"
                            >
                                <span>Buka Portal Ini</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Granted Capabilities */}
                            <div className="space-y-3">
                                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Hak Akses dan Kemampuan Utama:</span>
                                </span>
                                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                    {roleData[selectedRole].capabilities.map((cap, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                            <span className="leading-relaxed">{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Security Boundaries */}
                            <div className="space-y-3">
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <span>Batasan Keamanan dan Privasi:</span>
                                </span>
                                <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                    {roleData[selectedRole].restrictions.map((res, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 mt-1.5 flex-shrink-0" />
                                            <span className="leading-relaxed">{res}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 05: QUICK ROLE LAUNCHER & ARCHITECTURAL FOOTER
                ========================================================================= */}
            <section id="portal" className="relative z-10 pt-20 pb-14 px-4 sm:px-8 lg:px-12 border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#06070A] transition-colors duration-300 scroll-mt-24">
                <div className="max-w-7xl mx-auto w-full space-y-12">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-indigo-700 dark:text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>05 / PORTAL AKSES CEPAT</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                            Siap Mengoptimalkan Operasional Kantin Anda?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Coba langsung setiap modul operasional sistem, atau masuk menggunakan kredensial akun staf kafe Anda.
                        </p>
                    </div>

                    {/* 4 Quick Launch Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
                        {/* Card 1: Admin */}
                        <Link
                            href="/admin"
                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0D13] hover:bg-white dark:hover:bg-[#121524] border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400/50 transition-all duration-300 flex flex-col justify-between min-h-[190px] group shadow-xs hover:shadow-md hover:-translate-y-1"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3.5 group-hover:scale-105 transition-transform duration-200">
                                    <LayoutDashboard className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                    Portal Admin
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    Laporan Laba Rugi, Rekap Shift dan Kelola Inventaris
                                </p>
                            </div>
                            <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 pt-3 font-semibold">
                                <span>Buka /admin</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 2: Kasir POS */}
                        <Link
                            href="/pos"
                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0D13] hover:bg-white dark:hover:bg-[#121524] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between min-h-[190px] group shadow-xs hover:shadow-md hover:-translate-y-1"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3.5 group-hover:scale-105 transition-transform duration-200">
                                    <UtensilsCrossed className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">
                                    Terminal Kasir POS
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    Input pesanan cepat, barcode scanner dan cetak struk
                                </p>
                            </div>
                            <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-3 font-semibold">
                                <span>Buka /pos</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 3: Kitchen KDS */}
                        <Link
                            href="/kitchen"
                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0D13] hover:bg-white dark:hover:bg-[#121524] border border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between min-h-[190px] group shadow-xs hover:shadow-md hover:-translate-y-1"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3.5 group-hover:scale-105 transition-transform duration-200">
                                    <ChefHat className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-white transition-colors">
                                    Layar Dapur (KDS)
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    Antrean tiket masak otomatis, timer dan alarm lonceng
                                </p>
                            </div>
                            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-3 font-semibold">
                                <span>Buka /kitchen</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 4: QR Meja */}
                        <Link
                            href={sample_table_token ? `/table/${sample_table_token}` : '/table/demo'}
                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0D13] hover:bg-white dark:hover:bg-[#121524] border border-slate-200 dark:border-white/[0.08] hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between min-h-[190px] group shadow-xs hover:shadow-md hover:-translate-y-1"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3.5 group-hover:scale-105 transition-transform duration-200">
                                    <QrCode className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                                    Menu QR Meja
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    Simulasi pemesanan mandiri oleh pembeli di ponsel
                                </p>
                            </div>
                            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-3 font-semibold">
                                <span>Buka /table</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>

                    {/* Architectural Technical Footer */}
                    <footer className="border-t border-slate-200 dark:border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-2.5">
                            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider">Kasir App Ecosystem</span>
                            <span>•</span>
                            <span>Laravel 11 + Inertia React + Tailwind</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Transaksi Basis Data Atomik</span>
                            </span>
                            <span>&copy; {new Date().getFullYear()} Kasir App. Seluruh hak cipta dilindungi.</span>
                        </div>
                    </footer>
                </div>
            </section>
        </div>
    );
}
