# Project Rules: Canteen POS & QR Ordering (Laravel + Inertia.js)
# Design Language: Smoked Acrylic / Matte Glassmorphism (Deep Blue-Violet)

## 1. Tech Stack & Modular Architecture (Laravel + Inertia.js)
- **Backend (Laravel 11/12):**
  - Strictly use **Action/Service Pattern** (`app/Actions/`, `app/Services/`) for business logic (Cart math, Stock adjustments, Shift calculations, P&L aggregation). Keep Controllers thin and only responsible for returning `Inertia::render()` or redirect responses.
  - Use **FormRequests** for all validation and **Spatie Laravel Data / API Resources** to pass strictly typed `snake_case` props to Inertia.
  - Database columns and JSON props must strictly use `snake_case`.
- **Frontend (Inertia.js + React/Vue + Tailwind CSS):**
  - Organize by domain inside `resources/js/`:
    - `Pages/Admin/`, `Pages/Cashier/`, `Pages/Kitchen/`, `Pages/CustomerQR/`
    - `Features/Inventory/`, `Features/POS/`, `Features/KDS/`, `Features/Reports/`
    - `Components/Acrylic/` (Reusable Smoked Acrylic UI primitives: `AcrylicCard`, `AcrylicModal`, `AcrylicTable`, `SpecularButton`)
    - `Hooks/` (`useBarcodeScanner`, `useAudioAlert`, `useRealtimeKds`)
  - Use Inertia's `useForm` for mutations, `router.reload({ only: [...] })` for partial reloads, and preserve scroll/state (`preserveScroll: true`, `preserveState: true`) on table filtering.

## 2. Smoked Acrylic / Matte Glassmorphism Design System
- **BANNED "AI Slop" Glassmorphism:**
  - NEVER use bright rainbow/pink blobs floating behind white/milky translucent cards (`bg-white/30`).
  - NEVER use heavy outer neon glows (`shadow-purple-500/50`) or unreadable low-contrast text over busy backgrounds.
  - NEVER use excessive border radius (`rounded-3xl`). Stick to `rounded-xl` (`12px`) for panels and `rounded-lg` (`8px`) for inputs/buttons.
- **Core Visual Formula ("Smoked Acrylic"):**
  - **Base Canvas:** Deep Obsidian Carbon (`#07080D`) with a single restrained ambient radial light source in the top-left/top-center (`radial-gradient(ellipse 80% 50% at 50% -20%, rgba(55, 48, 163, 0.28), rgba(15, 23, 42, 0.05), transparent)`).
  - **Smoked Acrylic Surface (Cards, Sidebar, Sticky Headers):**
    - Background: `bg-[#0F111A]/85` or `bg-[#131624]/88` combined with `backdrop-blur-md` (`12px` to `16px`). High opacity ensures crisp text legibility.
    - Specular Top-Edge Border: `border border-white/[0.07]` with an top highlight `shadow-[inset_0_1px_0_0_rgba(165,180,252,0.12)]` to simulate real cut dark acrylic catching overhead light.
  - **Elevated Acrylic (Modals, Barcode Popups, Dropdowns):**
    - Background: `bg-[#16192B]/92 backdrop-blur-xl` with `border border-indigo-400/20` and deep ambient shadow `shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]`.
  - **Signature Primary Gradient (Blue-Violet Tanzanite):**
    - Primary Action Button: `bg-gradient-to-b from-[#4F46E5] to-[#3730A3]` with `border border-indigo-400/30` and `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)]`.
    - Active Sidebar / Tab State: `bg-gradient-to-r from-indigo-600/20 via-indigo-500/10 to-transparent` with a left indicator bar `border-l-2 border-indigo-400`.
- **Typography & Semantic Status Tokens:**
  - **Fonts:** `Plus Jakarta Sans` or `Inter` for UI labels; strict `JetBrains Mono` (`font-mono tabular-nums`) for all currency (`Rp`), stock quantities, barcodes, shift totals, and P&L figures.
  - **Status Badges (Smoked Tinted Pills):**
    - Emerald (Available / Paid / Profit): `bg-emerald-500/10 text-emerald-300 border border-emerald-500/25`
    - Amber (Kitchen Required / Low Stock): `bg-amber-500/10 text-amber-300 border border-amber-500/25`
    - Rose (Out of Stock "Habis" / Expense / Loss): `bg-rose-500/10 text-rose-300 border border-rose-500/25`

## 3. Mandatory Admin Business Logic
- **Kelola Menu, Harga & Stok Dasar:** Full CRUD with soft deletes, `requires_kitchen` toggle (True = KDS, False = Instant), and `is_available` lock when `stock_qty <= 0`[cite: 1, 2].
- **Barcode Scanner & Search:** Global listener for hardware USB barcode scanners + search input to quickly add new products or record `stock_movements` (`in`, `out`, `adjustment`).
- **Financial & Shift Reporting:**
  - **Rekap Pendapatan Harian & Riwayat Transaksi**[cite: 2].
  - **Rekap Shift Kasir:** Compare `opening_cash + total_cash_sales` vs `closing_cash_actual` and `total_qris_sales`[cite: 1, 2].
  - **Laporan Laba Rugi (P&L):** `Gross Revenue - Total COGS (unit_cost * qty) - Operational Expenses`. Include 1-click export routes for PDF and Excel (`.xlsx`).