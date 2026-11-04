# Project Rules: QR Table Ordering & POS System (Admin, Kasir, Dapur)

## 1. Architecture & Code Scalability
- **Feature-Driven Modular Structure:** Group code by domain/feature (`features/auth`, `features/pos-cashier`, `features/kitchen-display`, `features/inventory`, `features/finance-reports`, `features/qr-menu`), not just technical layers.
- **Separation of Concerns:**
  - **UI Components:** Strictly presentational. No direct API calls or complex database mutations inside UI views.
  - **Custom Hooks / State Controllers:** Handle state transitions, cart & change calculations, barcode scanner listeners, shift tracking, and audio notification triggers.
  - **Service Layer:** Centralize all API requests, WebSocket/SSE connections, PDF/Excel report generators, and data transformations.
- **Reusable Core Primitives:** Build shared hardware/utility hooks once (`useBarcodeScanner`, `useAudioAlert`, `useRealtimeQueue`, `useShiftSession`, `exportDataService`) and consume them across Admin, Kasir, and Dapur modules.
- **Database & API Naming:** Strictly enforce `snake_case` for all database tables, column names, and JSON payload keys. Use `camelCase` for internal frontend variables and `PascalCase` for UI components.

## 2. Core Business Logic Rules
- **Menu Availability & Cart Calculation:**
  - Products with `stock_qty <= 0` or `is_available == false` must be marked as "Habis" and disabled from selection or barcode scanning.
  - Cart dynamically calculates item subtotals (`quantity * unit_price`) and grand `total_amount`.
- **Order Confirmation, Payment & Change Validation:**
  - Cashier performs **Konfirmasi Pesanan** before processing payment (`tunai` or `qris`).
  - Strictly block payment submission and show an inline warning if `amount_received < total_amount`. Automatically compute `change_amount = amount_received - total_amount` and save the transaction receipt.
- **Order Routing (Instant vs. Kitchen KDS):** When an order is paid and validated, generate a queue `token_number` and check `product.requires_kitchen`:
  - If `false` (instant drinks/snacks), mark `item_status` as `instant` and deduct stock immediately.
  - If `true` (made-to-order like Mie/Nasi Goreng), automatically insert a record into `kitchen_tickets` with `ticket_status = 'waiting'` and broadcast a real-time event with the `token_number` to the Kitchen KDS.
- **Real-Time Kitchen Audio Alert:** The Kitchen view must listen to incoming `kitchen_tickets` events via WebSocket/SSE and trigger an immediate persistent audio alert until acknowledged by the kitchen staff.
- **Two-Step Fulfillment Handshake:**
  1. Kitchen finishes cooking -> sets status to `delivered_to_cashier` and brings the order to the cashier counter.
  2. Cashier receives item from Kitchen -> confirms `served` (Pesanan Selesai) and calls the customer's `token_number` or dispatches to their `table_number`.
- **Hardware Barcode Input:** Implement barcode scanning via a global keyboard-wedge listener (detecting rapid keystrokes ending with `Enter`) alongside camera-based QR/Barcode fallback. In Kasir, scanning adds the item to the cart; in Admin, scanning searches or adjusts base stock (`stock_qty`).
- **Admin Reporting & Profit/Loss Accuracy:**
  - Provide Transaction History, Daily Revenue Recap, and Cashier Shift Recap (`cashier_shifts`).
  - Always snapshot `unit_cost` and `unit_price` inside `order_items` at transaction time so Profit & Loss (`total_amount - total_cost - operational_expenses`) remains accurate. Support 1-click export to PDF and Excel.

## 3. UI/UX, Signature Blue-Violet Palette & Anti-"AI Slop" Guidelines
- **BANNED "AI Slop" Patterns:**
  - NO loud, oversaturated cyberpunk/pink-neon gradients (`from-indigo-500 via-purple-500 to-pink-500`).
  - NO heavy glowing drop-shadows (`shadow-purple-500/50`), blurry glassmorphism cards, floating 3D blobs, or excessive rounded corners (`rounded-3xl`).
- **Signature Primary Palette ("Obsidian Ultramarine & Tanzanite"):**
  - Use a restrained, executive blue-violet identity that feels architectural and calm:
    - **Primary Solid:** `#4338CA` (Deep Royal Indigo) to `#3B82F6` (Cobalt Blue) for crisp interactive states and focus rings.
    - **Signature Primary Gradient (Subtle & Architectural):** `linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #4338CA 100%)` for high-hierarchy surfaces (Active Shift Header, Primary CTA Buttons, Selected Table Card).
    - **Interactive Button Gradient:** `linear-gradient(180deg, #4F46E5 0%, #3730A3 100%)` paired with a crisp top inner highlight (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]`) for a tactile, physical keycap feel rather than a flat neon wash.
    - **Subtle Accent Surface (Active Cart Item / Selected Filter):** `linear-gradient(135deg, rgba(67, 56, 202, 0.12) 0%, rgba(30, 58, 138, 0.06) 100%)` with a `1px solid rgba(99, 102, 241, 0.35)` border.
- **Neutral Base & Semantic Status Colors:**
  - **Base Canvas:** Deep Carbon Slate (`#09090B` / `#0F172A`) for Dark Mode & KDS; Crisp Alabaster (`#F8FAFC`) with `#E2E8F0` 1px borders for Bright Canteen Mode.
  - **Semantic Status Tokens (Strictly for operational states, never decorative):**
    - Emerald (`#10B981`): Paid, Ready, Served, Stock In.
    - Amber (`#F59E0B`): Needs Kitchen Processing, Cooking in Progress, Low Stock.
    - Rose (`#F43F5E`): Unpaid, Underpayment Warning, Out of Stock ("Habis"), Urgent Delay.
- **Typography & Scannability:**
  - Clean geometric sans-serif (`Inter` or `Plus Jakarta Sans`) for UI navigation and product titles.
  - Strict `monospace` with `tabular-nums` (`JetBrains Mono`) for all prices, change calculations, token numbers, barcodes, kitchen timers, and P&L tables.
- **Role-Specific Ergonomics:**
  - **Kasir (POS):** Keyboard-first navigation, high-density split view (left: menu grid + barcode input, right: active cart, payment/change calculator & kitchen delivery confirmation bar), minimum `48x48px` touch targets.
  - **Dapur (KDS):** High-contrast card grid readable from 2 meters away, displaying `token_number`, live elapsed timer, and one-tap status progression.
  - **Admin:** Dense data tables with sticky headers, instant search/barcode filter, clean P&L summary cards, shift recap views, and direct 1-click PDF/Excel export buttons.

## 4. Code Quality & Output Standards
- Write strict, self-documenting code with explicit TypeScript interfaces/types (or strict backend schema validation).
- Never leave placeholder comments like `// TODO: implement logic here`. Write complete, working implementations.
- Execute order creation, stock deduction, shift revenue aggregation, and KDS ticket dispatch inside an atomic database transaction.
- Handle loading, empty, and error states gracefully using skeleton loaders and toast notifications—never raw `alert()` popups.

## 5. Strict Agent Execution Rules
- **No Deviations from the Signature Palette:** Never introduce arbitrary colors, neon pinks, cyber gradients, or bloated decorative cards. Always stick to the defined Obsidian Ultramarine, Tanzanite, and semantic status tokens.
- **No Incomplete Code / No Placeholders:** Every created controller, component, service, and migration must be fully implemented, syntactically verified, and follow existing project conventions.
- **Data Integrity First:** Any operation modifying orders, shifts, tickets, or inventory must be wrapped in `DB::transaction()` to prevent partial updates.
- **Pint Formatting Compliance:** When editing or generating PHP files, format the code using `vendor/bin/pint --dirty --format agent` to maintain consistency.
- **Documentation Restraint:** Do not create superfluous markdown documentation files unless explicitly requested by the user.
