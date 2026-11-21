-- =============================================================================
-- DATABASE SETUP SCRIPT: SISTEM KASIR & DAPUR KANTIN
-- Standar: MySQL 8.0+ / MariaDB 10.5+
-- Karakter Enkoding: utf8mb4 / utf8mb4_unicode_ci
-- Integritas Data: Strict Foreign Keys & ACID Transactional Engine
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `kasir_kantin_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `kasir_kantin_db`;

-- Matikan foreign key check sementara selama proses pembuatan skema
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Tabel: users (Staf & Hak Akses)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `role` ENUM('admin', 'kasir', 'dapur') NOT NULL DEFAULT 'kasir',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `remember_token` VARCHAR(100) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_username_unique` (`username`),
    INDEX `idx_users_role_active` (`role`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Tabel: categories (Kelompok Produk)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Tabel: dining_tables (Meja Makan & QR Self-Order)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `dining_tables`;
CREATE TABLE `dining_tables` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_number` VARCHAR(20) NOT NULL,
    `qr_code_token` VARCHAR(255) NOT NULL,
    `status` ENUM('available', 'occupied') NOT NULL DEFAULT 'available',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `dining_tables_table_number_unique` (`table_number`),
    UNIQUE KEY `dining_tables_qr_code_token_unique` (`qr_code_token`),
    INDEX `idx_dining_tables_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Tabel: products (Katalog Menu, HPP & Kontrol Dapur)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `barcode` VARCHAR(100) NULL DEFAULT NULL,
    `image_url` VARCHAR(255) NULL DEFAULT NULL,
    `product_name` VARCHAR(150) NOT NULL,
    `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'HPP Modal Snapshot',
    `selling_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Harga Jual Resmi',
    `stock_qty` INT NOT NULL DEFAULT 0 COMMENT 'Sisa Stok Fisik',
    `requires_kitchen` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Kirim KDS, 0 = Instan',
    `is_available` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = Habis / Terkunci',
    `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft Delete',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `products_barcode_unique` (`barcode`),
    INDEX `idx_products_category_id` (`category_id`),
    INDEX `idx_products_availability` (`is_available`, `stock_qty`),
    CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) 
        REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Tabel: stock_movements (Log Mutasi & Koreksi Stok)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `movement_type` ENUM('in', 'out', 'adjustment') NOT NULL,
    `quantity_change` INT NOT NULL,
    `notes` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_stock_movements_product_id` (`product_id`),
    INDEX `idx_stock_movements_user_id` (`user_id`),
    CONSTRAINT `fk_stock_movements_product_id` FOREIGN KEY (`product_id`) 
        REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stock_movements_user_id` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Tabel: cashier_shifts (Sesi Kerja Kasir & Rekap Laci)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cashier_shifts`;
CREATE TABLE `cashier_shifts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cashier_id` BIGINT UNSIGNED NOT NULL,
    `shift_name` VARCHAR(50) NOT NULL,
    `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `closed_at` TIMESTAMP NULL DEFAULT NULL,
    `opening_cash` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_cash_sales` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_qris_sales` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `closing_cash_actual` DECIMAL(12, 2) NULL DEFAULT NULL,
    `notes` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_cashier_shifts_cashier_id` (`cashier_id`),
    INDEX `idx_cashier_shifts_open_status` (`closed_at`),
    CONSTRAINT `fk_cashier_shifts_cashier_id` FOREIGN KEY (`cashier_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Tabel: orders (Master Transaksi & Penjualan)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `invoice_number` VARCHAR(50) NOT NULL,
    `token_number` VARCHAR(20) NOT NULL,
    `shift_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `table_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `cashier_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `customer_name` VARCHAR(100) NULL DEFAULT NULL,
    `order_source` ENUM('qr_table', 'cashier_direct') NOT NULL DEFAULT 'cashier_direct',
    `order_status` ENUM('pending', 'confirmed', 'processing', 'ready', 'served') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('tunai', 'qris') NOT NULL,
    `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    `total_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `amount_received` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `change_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `orders_invoice_number_unique` (`invoice_number`),
    INDEX `idx_orders_token_number` (`token_number`),
    INDEX `idx_orders_shift_id` (`shift_id`),
    INDEX `idx_orders_table_id` (`table_id`),
    INDEX `idx_orders_cashier_id` (`cashier_id`),
    INDEX `idx_orders_order_status` (`order_status`),
    INDEX `idx_orders_payment_status` (`payment_status`),
    INDEX `idx_orders_created_at` (`created_at`),
    CONSTRAINT `fk_orders_shift_id` FOREIGN KEY (`shift_id`) 
        REFERENCES `cashier_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_orders_table_id` FOREIGN KEY (`table_id`) 
        REFERENCES `dining_tables` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_orders_cashier_id` FOREIGN KEY (`cashier_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Tabel: order_items (Detail Item Transaksi & Snapshot HPP)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL,
    `unit_cost` DECIMAL(12, 2) NOT NULL COMMENT 'Snapshot HPP Unit',
    `unit_price` DECIMAL(12, 2) NOT NULL COMMENT 'Snapshot Harga Jual Unit',
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `notes` VARCHAR(255) NULL DEFAULT NULL,
    `item_status` ENUM('instant', 'queued_kds', 'cooking', 'delivered_to_cashier', 'served') NOT NULL DEFAULT 'instant',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_product_id` (`product_id`),
    INDEX `idx_order_items_status` (`item_status`),
    CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_product_id` FOREIGN KEY (`product_id`) 
        REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Tabel: kitchen_tickets (Antrean KDS Layar Dapur)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `kitchen_tickets`;
CREATE TABLE `kitchen_tickets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `token_number` VARCHAR(20) NOT NULL,
    `chef_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `ticket_status` ENUM('waiting', 'cooking', 'delivered_to_cashier', 'completed') NOT NULL DEFAULT 'waiting',
    `is_audio_notified` TINYINT(1) NOT NULL DEFAULT 0,
    `sent_to_kds_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `kitchen_tickets_order_item_id_unique` (`order_item_id`),
    INDEX `idx_kitchen_tickets_order_id` (`order_id`),
    INDEX `idx_kitchen_tickets_token_number` (`token_number`),
    INDEX `idx_kitchen_tickets_status` (`ticket_status`),
    CONSTRAINT `fk_kitchen_tickets_order_id` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_kitchen_tickets_order_item_id` FOREIGN KEY (`order_item_id`) 
        REFERENCES `order_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_kitchen_tickets_chef_id` FOREIGN KEY (`chef_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Tabel: operational_expenses (Biaya Operasional Luar HPP)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `operational_expenses`;
CREATE TABLE `operational_expenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `expense_name` VARCHAR(150) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `expense_date` DATE NOT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_operational_expenses_date` (`expense_date`),
    INDEX `idx_operational_expenses_user_id` (`user_id`),
    CONSTRAINT `fk_operational_expenses_user_id` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Tabel: system_settings (Konfigurasi Keamanan & Sistem)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL DEFAULT NULL,
    `group` VARCHAR(50) NOT NULL DEFAULT 'general',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `system_settings_key_unique` (`key`),
    INDEX `idx_system_settings_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aktifkan kembali pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA AWAL (DEFAULT ACCOUNTS, CATEGORIES, PRODUCTS & SETTINGS)
-- =============================================================================

-- Akun default staf (Password default: 'password123')
INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
(1, 'admin', '$2y$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQ6E6ny9N11rF2Rz2zQ3y', 'Administrator', 'admin', 1),
(2, 'kasir1', '$2y$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQ6E6ny9N11rF2Rz2zQ3y', 'Kasir Utama', 'kasir', 1),
(3, 'chef1', '$2y$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQ6E6ny9N11rF2Rz2zQ3y', 'Chef Dapur', 'dapur', 1);

-- Kategori Menu
INSERT INTO `categories` (`id`, `category_name`) VALUES
(1, 'Makanan'),
(2, 'Minuman'),
(3, 'Snack & Dessert');

-- Meja Fisik & Token QR Acak
INSERT INTO `dining_tables` (`id`, `table_number`, `qr_code_token`, `status`) VALUES
(1, 'Meja 1', 'wdvOK3tP5HpIsE05V18WhJv9w9DoH0ya', 'available'),
(2, 'Meja 2', 'Lp82kP1xQ84vZsE1093JkL098AqZ1122', 'available'),
(3, 'Meja 3', 'Kq71aB9xL12vWe45091ZaQ109OpX8877', 'available'),
(4, 'Meja 4', 'Mn99pQ2wE45rTy78102PlM210ZaC4433', 'available'),
(5, 'Meja 5', 'Zx12cV34bN56mK78901QwE123RtY4567', 'available');

-- Master Produk dengan Snapshot HPP & Flag Routing Dapur
INSERT INTO `products` (`id`, `category_id`, `barcode`, `product_name`, `cost_price`, `selling_price`, `stock_qty`, `requires_kitchen`, `is_available`) VALUES
(1, 1, '8991001', 'Nasi Goreng Spesial', 12000.00, 20000.00, 50, 1, 1),
(2, 1, '8991002', 'Mie Goreng Seafood', 14000.00, 23000.00, 40, 1, 1),
(3, 2, '8992001', 'Es Teh Manis', 1500.00, 5000.00, 100, 0, 1),
(4, 2, '8992002', 'Kopi Susu Gula Aren', 6000.00, 15000.00, 50, 0, 1),
(5, 3, '8993001', 'Kentang Goreng (French Fries)', 7000.00, 14000.00, 30, 1, 1);

-- Pengaturan Keamanan Anti-Iseng, Profil Kafe & Konfigurasi Sistem
INSERT INTO `system_settings` (`key`, `value`, `group`) VALUES
('store_name', 'KASIR CAFE CANTEEN', 'general'),
('store_address', 'Jl. R.E. Martadinata No. 42, Ciamis', 'general'),
('store_phone', '0812-3456-7890', 'general'),
('receipt_footer', 'Terima Kasih Atas Kunjungan Anda! Harap Simpan Struk Sebagai Bukti Pembayaran Resmi.', 'general'),
('thermal_paper_width', '58mm', 'hardware'),
('qr_auto_rotate_token', '1', 'security'),
('qr_require_cashier_verification', '1', 'security'),
('qr_rate_limit_per_minute', '3', 'security'),
('qr_table_pin_enabled', '0', 'security'),
('qr_table_pin_code', '1234', 'security'),
('maintenance_mode', '0', 'maintenance'),
('maintenance_message', 'Sistem sedang dalam proses pemeliharaan & pengembangan fitur baru.', 'maintenance');

-- Biaya Operasional Riil (Contoh Awal)
INSERT INTO `operational_expenses` (`id`, `user_id`, `expense_name`, `amount`, `expense_date`, `notes`) VALUES
(1, 1, 'Beli Es Batu Kristal 10 Bal', 50000.00, CURDATE(), 'Pasokan es batu harian untuk bar minuman'),
(2, 1, 'Beli Gas LPG 3Kg (2 Tabung)', 44000.00, CURDATE(), 'Bahan bakar kompor dapur');

-- =============================================================================
-- ATURAN BISNIS ARSITEKTUR & PANDUAN EKSEKUSI TRANSAKSI (LEAD TEKNIS)
-- =============================================================================
-- 1. Transaksi Atomik (DB::transaction):
--    Setiap pembuatan pesanan, pemotongan stok `products.stock_qty`, penambahan
--    pendapatan shift `cashier_shifts.total_cash_sales`, dan pembuatan tiket
--    `kitchen_tickets` WAJIB dieksekusi di dalam satu blok transaksi database
--    untuk mencegah race conditions atau stok minus.
--
-- 2. Snapshot Harga & Akurasi Laba Rugi:
--    Nilai `order_items.unit_cost` dan `order_items.unit_price` diisi secara
--    permanen saat transaksi berhasil dibayar. Rumus Laba Kotor = total_amount - total_cost.
--    Rumus Laba Bersih = total_amount - total_cost - SUM(operational_expenses.amount).
--
-- 3. Fulfillment Handshake Dua Arah:
--    a. Koki menyentuh tiket -> `ticket_status` berubah dari 'waiting' ke 'cooking'.
--    b. Koki selesai memasak -> ubah ke 'delivered_to_cashier', bawa makanan ke meja kasir.
--    c. Kasir menerima makanan -> kasir mengonfirmasi 'served' (selesai), panggil pelanggan,
--       dan otomatis mereset status meja ke 'available'.
-- =============================================================================