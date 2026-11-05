import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
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
    Zap,
    Volume2,
} from 'lucide-react';

/* =========================================================================
   3D ARCHITECTURAL CONTOUR LINE / WIREFRAME BACKGROUND (CANVAS)
   Subtle, restrained, high-FPS canvas ribbons in Obsidian Ultramarine.
   ========================================================================= */
function ContourWireframeCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        let scrollY = window.scrollY;
        let scrollVelocity = 0;
        let lastScrollY = window.scrollY;

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            targetMouseX = (e.clientX - width / 2) * 0.04;
            targetMouseY = (e.clientY - height / 2) * 0.04;
        };

        const handleScroll = () => {
            scrollY = window.scrollY;
            scrollVelocity = (scrollY - lastScrollY) * 0.3;
            lastScrollY = scrollY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll, { passive: true });

        const ribbonCount = 5;
        const segmentCount = 36;
        let time = 0;

        const render = () => {
            time += 0.008;
            scrollVelocity *= 0.92;
            mouseX += (targetMouseX - mouseX) * 0.04;
            mouseY += (targetMouseY - mouseY) * 0.04;

            ctx.clearRect(0, 0, width, height);

            const centerX = width * 0.5;
            const centerY = height * 0.4;
            const fov = 380;

            for (let r = 0; r < ribbonCount; r++) {
                const ribbonOffset = (r - (ribbonCount - 1) / 2) * 55;
                const points = [];

                for (let s = 0; s <= segmentCount; s++) {
                    const u = s / segmentCount;
                    const z = 100 + u * 1100;

                    const wave1 = Math.sin(u * 4.2 - time * 0.6 + r * 0.3) * 30;
                    const wave2 = Math.cos(u * 2.8 + time * 0.4 - r * 0.2) * 18;
                    const velocityDistort = Math.sin(u * Math.PI) * scrollVelocity * 0.3;

                    const x = (u - 0.5) * 1600 + ribbonOffset * 2.2 + mouseX * (1 - u * 0.4);
                    const y = wave1 + wave2 + velocityDistort + (r - 2) * 26 + mouseY * (1 - u * 0.3);

                    const scale = fov / (z + 260);
                    const projX = centerX + x * scale;
                    const projY = centerY + y * scale;

                    points.push({ x: projX, y: projY, z, u });
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

                    const alpha = Math.max(0.03, 0.15 - (r / ribbonCount) * 0.06);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                    ctx.lineWidth = r === 2 ? 1.5 : 0.9;
                    ctx.stroke();

                    // Moving data pulse
                    const pulseProgress = (time * 0.25 + r * 0.18) % 1;
                    const pulseIdx = Math.floor(pulseProgress * (points.length - 1));
                    const pulsePoint = points[pulseIdx];

                    if (pulsePoint && pulsePoint.z < 850) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(pulsePoint.x, pulsePoint.y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = '#C7D2FE';
                        ctx.shadowColor = '#818CF8';
                        ctx.shadowBlur = 6;
                        ctx.fill();
                        ctx.restore();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-40"
            aria-hidden="true"
        />
    );
}

/* =========================================================================
   MAIN PROMOTIONAL LANDING PAGE (WELCOME)
   ========================================================================= */
export default function Welcome({ sample_table_token = null, sample_table_number = 'Meja 1' }) {
    // Reset scroll to top on mount to prevent browser restoring half-scrolled state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                window.history.scrollRestoration = 'manual';
            } catch (e) {
                // ignore
            }
            window.scrollTo(0, 0);
        }
    }, []);

    // Interactive Simulation State
    const [simulatedToken, setSimulatedToken] = useState(42);
    const [simulatedStep, setSimulatedStep] = useState(1);
    const [isSimulating, setIsSimulating] = useState(false);

    // Interactive Step for Section 2
    const [activeFlowStep, setActiveFlowStep] = useState(0);

    // Interactive Role Matrix for Section 4
    const [selectedRole, setSelectedRole] = useState('admin');

    // Trigger pulse simulation on Hero schematic
    const triggerSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimulatedStep(1);

        setTimeout(() => setSimulatedStep(2), 900);
        setTimeout(() => setSimulatedStep(3), 1800);
        setTimeout(() => {
            setSimulatedToken((prev) => prev + 1);
            setIsSimulating(false);
            setSimulatedStep(1);
        }, 3000);
    };

    // Flow Pipeline Steps Definition
    const flowSteps = [
        {
            num: '01',
            badge: 'Pemesanan Mandiri',
            title: 'Scan QR Meja / Input Cepat Kasir',
            desc: 'Pelanggan memesan mandiri langsung dari meja via QR tanpa harus mengantre. Kasir juga dapat menginput pesanan walk-in secepat kilat dengan klik menu atau pemindaian hardware barcode scanner (120ms latency).',
            tech: ['QR Token Generator', 'Keyboard-Wedge 120ms', 'Zero Queue Waiting'],
        },
        {
            num: '02',
            badge: 'Routing Cerdas',
            title: 'Smart Order Routing (Instan vs Dapur)',
            desc: 'Sistem memisahkan pesanan secara instan: minuman atau snack instan langsung potong stok tanpa membebani koki. Menu olahan masak (Mie, Nasi Goreng) otomatis dikirimkan ke layar antrean dapur.',
            tech: ['Atomic DB Transaction', 'requires_kitchen Flag', 'Token Dispatching'],
        },
        {
            num: '03',
            badge: 'Alarm Suara KDS',
            title: 'Alarm Audio Otomatis di Layar KDS Dapur',
            desc: 'Koki tidak perlu memelototi layar terus-menerus. Layar KDS di dapur langsung membunyikan audio chime persisten setiap kali ada tiket makanan baru yang harus dimasak hingga koki mengonfirmasi pesanan.',
            tech: ['Web Audio API Chime', 'Live Elapsed Timer', 'KDS Card Readability (2m)'],
        },
        {
            num: '04',
            badge: 'Handshake Selesai',
            title: 'Dua Langkah Penyajian & Konfirmasi Kasir',
            desc: 'Koki selesai memasak -> ubah status menjadi Diantar ke Kasir. Kasir menerima makanan dari dapur, memanggil nomor token atau mengantar ke meja pelanggan, lalu menekan tombol Konfirmasi Selesai (Served).',
            tech: ['Fulfillment Handshake', 'Zero Food Left Behind', '100% Audit Kecepatan'],
        },
    ];

    // Role Matrix Data Definition
    const roleData = {
        admin: {
            title: 'Administrator Eksekutif',
            tagline: 'Kontrol Penuh Inventaris, Pembukuan Laba Rugi & Manajemen Hak Akses Staf',
            portal: '/admin',
            badgeColor: 'border-indigo-400/30 text-indigo-300 bg-indigo-500/10',
            capabilities: [
                'Bento Ringkasan Keuangan: Omset Harian, HPP Modal, Beban Operasional & Laba Bersih akurat.',
                'Katalog Menu & Penyesuaian Stok (Stock Adjustment): Mutasi barang masuk, keluar, dan koreksi fisik.',
                'Audit Shift Kasir: Rekonsiliasi modal awal, penjualan tunai vs QRIS, dan pencatatan selisih kas fisik.',
                'Manajemen Pengguna (CRUD Users): Pengaturan peran admin, kasir, koki dapur, serta reset password.',
                'Ekspor 1-Klik: Cetak laporan resmi ke format PDF dan unduh spreadsheet data transaksi Excel (.csv).',
            ],
            restrictions: [
                'Tidak diperuntukkan untuk memproses operasional memasak harian di kompor dapur.',
            ],
        },
        kasir: {
            title: 'Kasir POS Terminal',
            tagline: 'Terminal Transaksi Cepat, Hardware Barcode Scanner & Validasi Pembayaran',
            portal: '/pos',
            badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
            capabilities: [
                'Buka & Tutup Sesi Shift: Input modal awal laci kasir (opening cash) dan closing cash aktual saat tutup toko.',
                'Hardware Barcode Scanner Support: Deteksi otomatis keystroke scanner untuk langsung memasukkan menu ke keranjang.',
                'Underpayment Guard & Kembalian: Pembayaran Tunai & QRIS dengan kalkulator kembalian instan dan proteksi uang kurang.',
                'Validasi Pesanan Meja QR: Konfirmasi pesanan dine-in pelanggan dan penetapan nomor meja.',
                'Handshake Penyerahan: Notifikasi pesanan selesai dari dapur dan konfirmasi penyerahan makanan ke pembeli.',
            ],
            restrictions: [
                'Tidak dapat mengedit data modal HPP produk atau mengubah hak akses akun pengguna lain.',
            ],
        },
        dapur: {
            title: 'Koki Dapur (Kitchen KDS)',
            tagline: 'Layar Tiket Antrean Kontras Tinggi dengan Alarm Suara & Timer Masak',
            portal: '/kitchen',
            badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
            capabilities: [
                'Antrean Visual Terbaca dari Jarak 2 Meter: Kartu tiket gelap dengan aksen bar status 2px dan nomor token besar.',
                'Alarm Suara Otomatis: Bunyi chime instan saat pesanan masak masuk dan tombol heningkan bell.',
                'Live Elapsed Timer: Penghitung menit dan detik durasi masak dengan warna indikator urgensi (Amber & Rose).',
                'Status Progression 1-Tap: Tombol satu sentuhan dari Menunggu -> Mulai Masak -> Selesai Masak & Antar ke Kasir.',
                'Sinkronisasi Real-Time: Auto-sync berkala untuk menarik tiket pesanan terbaru secara otomatis.',
            ],
            restrictions: [
                'Tidak memiliki akses ke laporan laba rugi, manipulasi harga modal menu, atau pembukuan uang kasir.',
            ],
        },
        pelanggan: {
            title: 'Pelanggan Meja (QR Self-Order)',
            tagline: 'Pemesanan Mandiri Tanpa Aplikasi, Cukup Scan QR di Atas Meja Makan',
            portal: sample_table_token ? `/table/${sample_table_token}` : '/table/demo',
            badgeColor: 'border-blue-400/30 text-blue-300 bg-blue-500/10',
            capabilities: [
                'Akses Instan Tanpa Instalasi: Cukup buka kamera HP dan scan stiker QR unik yang ada di meja makan.',
                'Katalog Makanan Interaktif: Filter kategori menu, foto, harga, dan indikator otomatis stok Habis.',
                'Catatan Khusus Koki: Pelanggan dapat memasukkan catatan selera (misal: "Jangan terlalu pedas, es dipisah").',
                'Pilihan Bayar Fleksibel: Kemudahan bayar mandiri atau bayar tunai di counter kasir.',
                'Live Tracking Antrean: Pemantauan nomor token dan status pesanan secara real-time dari HP.',
            ],
            restrictions: [
                'Tidak dapat mengakses dasbor internal sistem, antrean meja lain, atau data operasional kasir.',
            ],
        },
    };

    return (
        <div className="relative min-h-screen bg-[#06070A] text-slate-100 font-sans selection:bg-indigo-500/20 selection:text-indigo-200 antialiased overflow-x-hidden">
            <Head title="Kasir App - Canteen QR Ordering, POS & Kitchen Display System" />

            {/* 3D Wireframe Canvas Background */}
            <ContourWireframeCanvas />

            {/* Top Radial Ambient Spotlight */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(49, 46, 129, 0.18), transparent 70%)',
                }}
            />

            {/* =========================================================================
                TOP STICKY NAVBAR (Natural Document Flow, Never Covers or Swallows Content)
               ========================================================================= */}
            <header className="sticky top-0 z-50 w-full bg-[#06070A]/95 backdrop-blur-md border-b border-white/[0.08]">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#4338CA] to-[#312E81] flex items-center justify-center border border-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                            <Store className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm tracking-wider text-slate-100 uppercase">
                                KASIR APP
                            </span>
                            <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-indigo-300 bg-white/[0.05] border border-white/[0.08]">
                                POS & KDS v2.4
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-400">
                        <a href="#hero" className="hover:text-white transition-colors">
                            Overview
                        </a>
                        <a href="#flow" className="hover:text-white transition-colors">
                            Alur Sistem
                        </a>
                        <a href="#features" className="hover:text-white transition-colors">
                            Fitur Teknis
                        </a>
                        <a href="#roles" className="hover:text-white transition-colors">
                            Hak Akses
                        </a>
                    </nav>

                    {/* Action CTAs */}
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/pos"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
                        >
                            <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Demo POS</span>
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98]"
                        >
                            <span>Masuk Sistem</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                SECTION 01: HERO & LIVE TRANSACTION PULSE SCHEMATIC
                Natural top padding so it NEVER gets swallowed behind the header!
               ========================================================================= */}
            <section id="hero" className="relative z-10 pt-10 sm:pt-14 pb-20 px-4 sm:px-8 lg:px-12">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Hero Header Text */}
                    <div className="text-center max-w-4xl mx-auto space-y-5">
                        {/* Status Badge */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-xs font-mono text-indigo-300 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>ZERO KITCHEN COMMUTE • REAL-TIME AUDIO KDS • DUAL BARCODE</span>
                            </div>
                        </div>

                        {/* Headline with 100% Solid Visible Colors (No Broken Transparent Gradient) */}
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
                            Sistem Kasir & Dapur Kantin{' '}
                            <span className="text-indigo-400 block sm:inline">
                                Tanpa Antre, Tanpa Mondar-Mandir.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Ekosistem operasional kantin terintegrasi penuh: Pesan mandiri via QR Meja, kasir
                            dengan hardware barcode scanner, Kitchen Display System (KDS) berdering otomatis,
                            dan kalkulasi laba rugi real-time.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                            <Link
                                href="/pos"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98]"
                            >
                                <UtensilsCrossed className="w-4 h-4" />
                                <span>Buka Terminal Kasir</span>
                            </Link>

                            {sample_table_token ? (
                                <Link
                                    href={`/table/${sample_table_token}`}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#0B0D13] hover:bg-[#121520] text-slate-300 hover:text-white border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors"
                                >
                                    <QrCode className="w-4 h-4 text-indigo-400" />
                                    <span>Uji Coba Menu QR ({sample_table_number})</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#0B0D13] hover:bg-[#121520] text-slate-300 hover:text-white border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors"
                                >
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    <span>Login Portal Admin</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* =========================================================================
                        INTERACTIVE SYSTEM SCHEMATIC PREVIEW (COMPACT & FULLY VISIBLE)
                       ========================================================================= */}
                    <div className="mt-10 max-w-5xl mx-auto">
                        <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0D13]/90 backdrop-blur-md border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.04)] space-y-4">
                            {/* Card Header Bar */}
                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
                                        SIMULASI ALIRAN DATA OPERASIONAL REAL-TIME
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={triggerSimulation}
                                    disabled={isSimulating}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-white/[0.04] hover:bg-white/[0.08] text-indigo-300 hover:text-white border border-white/[0.08] transition-colors disabled:opacity-50"
                                >
                                    <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-bounce text-amber-400' : ''}`} />
                                    <span>{isSimulating ? 'Memproses Aliran Data...' : 'Picu Order Baru (Simulate)'}</span>
                                </button>
                            </div>

                            {/* Three Schematic Nodes: 3 Columns on sm screens */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {/* Node 1: Meja QR */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 1
                                            ? 'bg-[#12162A] border-indigo-400/50 ring-1 ring-indigo-400/30 shadow-lg'
                                            : 'bg-[#08090D] border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>NODE 01: MEJA QR</span>
                                            </span>
                                            <span className="text-indigo-300 font-bold">#04</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-semibold text-slate-100">
                                            Pesanan Masuk via QR HP
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            2x Nasi Goreng + 2x Es Teh
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Status Meja:</span>
                                        <span className="text-emerald-400 font-semibold">Terkirim (14ms)</span>
                                    </div>
                                </div>

                                {/* Node 2: Kasir POS */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 2
                                            ? 'bg-[#121E20] border-emerald-400/50 ring-1 ring-emerald-400/30 shadow-lg'
                                            : 'bg-[#08090D] border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>NODE 02: KASIR TERMINAL</span>
                                            </span>
                                            <span className="text-emerald-300 font-bold">POS</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-semibold text-slate-100">
                                            Validasi Kasir & Cetak Struk
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            Pembayaran Tunai Rp 60.000 (Pas)
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Nomor Token:</span>
                                        <span className="text-indigo-300 font-bold">#{simulatedToken}</span>
                                    </div>
                                </div>

                                {/* Node 3: Dapur KDS */}
                                <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                        simulatedStep === 3
                                            ? 'bg-[#1D1714] border-amber-400/50 ring-1 ring-amber-400/30 shadow-lg'
                                            : 'bg-[#08090D] border-white/[0.06]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                                                <span>NODE 03: KITCHEN DISPLAY</span>
                                            </span>
                                            <span className="text-amber-300 font-bold">KDS</span>
                                        </div>
                                        <div className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                                            <span>Alarm Suara Aktif</span>
                                            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            Tiket Dapur: 2x Nasi Goreng
                                        </div>
                                    </div>
                                    <div className="pt-2.5 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Timer Masak:</span>
                                        <span className="text-amber-400 font-bold">00:24 (Live)</span>
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
            <section id="flow" className="relative z-20 py-20 sm:py-28 px-4 sm:px-8 lg:px-12 border-t border-white/[0.06] bg-[#07080D]">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Consistent Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>02 / ALUR SISTEM OPERASIONAL</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
                            Menghapus Kebiasaan Kasir Bolak-Balik ke Dapur.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Alur pesanan terarah yang memangkas waktu tunggu hingga 60%. Tanpa nota kertas yang
                            hilang, tanpa salah catat pesanan, dan tanpa antrean panjang di depan meja kasir.
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
                                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all select-none flex flex-col justify-between min-h-[260px] ${
                                        isSelected
                                            ? 'bg-[#0B0D13] border-indigo-400/50 ring-1 ring-indigo-400/20 shadow-xl'
                                            : 'bg-[#08090D] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#0B0D13]'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-mono mb-3">
                                            <span className="text-2xl sm:text-3xl font-black text-slate-200">
                                                {step.num}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                                                {step.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-white/[0.06] space-y-1">
                                        {step.tech.map((t, i) => (
                                            <div
                                                key={i}
                                                className="text-[10px] font-mono text-indigo-300/80 truncate flex items-center gap-1.5"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interactive Flow Detail Spotlight Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-sm flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold text-indigo-300">
                                {flowSteps[activeFlowStep].num}
                            </div>
                            <div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                                    Tahap Terpilih: {flowSteps[activeFlowStep].title}
                                </span>
                                <span className="text-xs text-slate-400 block font-mono mt-0.5">
                                    Status: Terintegrasi Penuh & Terverifikasi Otomatis
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveFlowStep((prev) => (prev > 0 ? prev - 1 : flowSteps.length - 1))
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
                            >
                                &larr; Sebelumnya
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveFlowStep((prev) => (prev < flowSteps.length - 1 ? prev + 1 : 0))
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
                            >
                                Selanjutnya &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 03: CORE TECHNICAL FEATURES (BENTO GRID)
               ========================================================================= */}
            <section id="features" className="relative z-30 py-20 sm:py-28 px-4 sm:px-8 lg:px-12 border-t border-white/[0.06]">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Consistent Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>03 / FITUR TEKNIS UNGGULAN</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
                            Perangkat Keras, Keuangan & Stok yang Bekerja Harmonis.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Dirancang untuk ketahanan operasional ritel makanan: kalkulasi tanpa selisih,
                            proteksi underpayment, dan sinkronisasi hardware scanner.
                        </p>
                    </div>

                    {/* Bento Grid: 4 Core Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Feature 1: Dual-Mode Barcode Scanner */}
                        <div className="p-6 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                                        <ScanLine className="w-4 h-4 text-indigo-400" />
                                        <span>Dual-Mode Hardware Barcode Listener</span>
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                        Keyboard-Wedge Ready
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Mendengarkan input tembakan scanner secara global tanpa perlu mengarahkan kursor
                                    ke kolom teks. Di Kasir otomatis menambahkan item ke keranjang dan menghitung
                                    total; di Admin otomatis memfilter produk dan membuka formulir stok.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#07080B] border border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Scan Barcode:</span>
                                <span className="text-indigo-300 font-bold">8991002340 &rarr; Auto Add Cart</span>
                            </div>
                        </div>

                        {/* Feature 2: Smart Payment & Underpayment Guard */}
                        <div className="p-6 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                        <span>Proteksi Pembayaran & Hitung Kembalian</span>
                                    </span>
                                    <span className="text-[10px] text-indigo-300 font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                                        Tunai & QRIS
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Secara ketat memblokir transaksi jika uang fisik diterima kurang dari total
                                    tagihan belanja dengan peringatan jelas. Kembalian dihitung secara otomatis dengan
                                    presisi matematis untuk menjaga integritas kasir.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#07080B] border border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Uang Diterima &ge; Total:</span>
                                <span className="text-emerald-400 font-bold">Kembalian: Rp 15.000 (Pass)</span>
                            </div>
                        </div>

                        {/* Feature 3: Auto-Lock Menu Habis */}
                        <div className="p-6 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                                        <span>Auto-Lock Menu Habis (Stok 0)</span>
                                    </span>
                                    <span className="text-[10px] text-rose-400 font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                                        Zero Overbooking
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Begitu stok menu mencapai angka 0 atau dinonaktifkan di dasbor admin, sistem secara
                                    otomatis mengunci produk tersebut di katalog Kasir dan QR Pelanggan dengan tanda
                                    Habis, mencegah pelanggan memesan menu yang bahannya sudah kosong.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#07080B] border border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Kondisi Stok &le; 0:</span>
                                <span className="text-rose-400 font-bold inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Terkunci Otomatis (Habis)</span>
                                </span>
                            </div>
                        </div>

                        {/* Feature 4: Real-Time Profit & Loss (Laba Rugi) */}
                        <div className="p-6 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                                        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                                        <span>Laba Bersih & 1-Click Export Resmi</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                                        PDF & Excel .csv
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Setiap baris transaksi menyimpan snapshot harga modal (HPP) dan harga jual saat
                                    transaksi berlangsung. Laba bersih terhitung akurat: Omset - HPP - Beban
                                    Operasional, siap diunduh 1-klik untuk laporan manajerial.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#07080B] border border-white/[0.06] text-xs font-mono flex items-center justify-between">
                                <span className="text-slate-500">Rumus Laba Rugi:</span>
                                <span className="text-indigo-300 font-bold">Omset - (HPP + Beban)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                SECTION 04: ROLE & ACCESS CONTROL MATRIX
               ========================================================================= */}
            <section id="roles" className="relative z-40 py-20 sm:py-28 px-4 sm:px-8 lg:px-12 border-t border-white/[0.06] bg-[#07080D]">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {/* Consistent Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>04 / MATRIKS PERAN & HAK AKSES</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
                            Hak Akses Terpisah Sesuai Tanggung Jawab Operasional.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Setiap peran pengguna disajikan antarmuka ergonomis yang disesuaikan dengan alur
                            kerjanya, mencegah kebocoran data laba dan mengeliminasi kesalahan staf.
                        </p>
                    </div>

                    {/* Role Selector Tabs (Centered) */}
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
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-white/[0.09] text-white border border-white/[0.14] font-semibold shadow-md'
                                            : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Role Matrix Card */}
                    <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-2xl bg-[#0B0D13] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-6">
                        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                                        {roleData[selectedRole].title}
                                    </h3>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-mono border ${roleData[selectedRole].badgeColor}`}
                                    >
                                        Portal: {roleData[selectedRole].portal}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    {roleData[selectedRole].tagline}
                                </p>
                            </div>

                            <Link
                                href={roleData[selectedRole].portal}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.08] transition-colors"
                            >
                                <span>Buka Portal Ini</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Granted Capabilities */}
                            <div className="space-y-3">
                                <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Hak Akses & Kemampuan Utama (Granted):</span>
                                </span>
                                <ul className="space-y-2 text-xs text-slate-300">
                                    {roleData[selectedRole].capabilities.map((cap, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                            <span className="leading-relaxed">{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Security Boundaries */}
                            <div className="space-y-3">
                                <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <span>Batasan Keamanan & Privasi (Boundary Guard):</span>
                                </span>
                                <ul className="space-y-2 text-xs text-slate-400">
                                    {roleData[selectedRole].restrictions.map((res, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
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
            <section className="relative z-50 pt-20 pb-14 px-4 sm:px-8 lg:px-12 border-t border-white/[0.08] bg-[#06070A]">
                <div className="max-w-7xl mx-auto w-full space-y-12">
                    {/* Consistent Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>05 / PORTAL AKSES CEPAT</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
                            Siap Mengoptimalkan Operasional Kantin Anda?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Uji coba langsung setiap modul sistem tanpa hambatan, atau masuk menggunakan kredensial
                            akun resmi bisnis Anda.
                        </p>
                    </div>

                    {/* 4 Quick Launch Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
                        {/* Card 1: Admin */}
                        <Link
                            href="/admin"
                            className="p-5 rounded-2xl bg-[#0B0D13] hover:bg-[#121524] border border-white/[0.08] hover:border-indigo-400/40 transition-all flex flex-col justify-between min-h-[190px] group shadow-sm hover:shadow-lg"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3.5 group-hover:scale-105 transition-transform">
                                    <LayoutDashboard className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                                    Portal Admin
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Laporan Laba Rugi, Rekap Shift & Kelola Inventaris
                                </p>
                            </div>
                            <div className="text-xs font-mono text-indigo-400 flex items-center gap-1 pt-3">
                                <span>Buka /admin</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 2: Kasir POS */}
                        <Link
                            href="/pos"
                            className="p-5 rounded-2xl bg-[#0B0D13] hover:bg-[#121524] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between min-h-[190px] group shadow-sm hover:shadow-lg"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3.5 group-hover:scale-105 transition-transform">
                                    <UtensilsCrossed className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                                    Terminal Kasir POS
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Input pesanan cepat, barcode scanner & cetak struk
                                </p>
                            </div>
                            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1 pt-3">
                                <span>Buka /pos</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 3: Kitchen KDS */}
                        <Link
                            href="/kitchen"
                            className="p-5 rounded-2xl bg-[#0B0D13] hover:bg-[#121524] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between min-h-[190px] group shadow-sm hover:shadow-lg"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3.5 group-hover:scale-105 transition-transform">
                                    <ChefHat className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                                    Layar Dapur (KDS)
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Antrean tiket masak otomatis, timer & alarm suara
                                </p>
                            </div>
                            <div className="text-xs font-mono text-amber-400 flex items-center gap-1 pt-3">
                                <span>Buka /kitchen</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        {/* Card 4: QR Meja */}
                        <Link
                            href={sample_table_token ? `/table/${sample_table_token}` : '/table/demo'}
                            className="p-5 rounded-2xl bg-[#0B0D13] hover:bg-[#121524] border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col justify-between min-h-[190px] group shadow-sm hover:shadow-lg"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3.5 group-hover:scale-105 transition-transform">
                                    <QrCode className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                                    Menu QR Meja
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Simulasi pemesanan mandiri oleh pembeli di HP
                                </p>
                            </div>
                            <div className="text-xs font-mono text-blue-400 flex items-center gap-1 pt-3">
                                <span>Buka /table</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>

                    {/* Architectural Technical Footer */}
                    <footer className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-2.5">
                            <Store className="w-4 h-4 text-indigo-400" />
                            <span className="text-slate-300 font-bold uppercase tracking-wider">Kasir App Ecosystem</span>
                            <span>•</span>
                            <span>Laravel 11 + Inertia React + Tailwind</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Atomic Transaction Engine</span>
                            </span>
                            <span>&copy; {new Date().getFullYear()} Kasir App. All rights reserved.</span>
                        </div>
                    </footer>
                </div>
            </section>
        </div>
    );
}
