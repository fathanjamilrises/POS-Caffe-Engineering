<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\OperationalExpense;
use App\Models\Product;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Default Users (Admin, Kasir, Dapur)
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'password_hash' => Hash::make('password123'),
                'full_name' => 'Administrator',
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $kasir = User::firstOrCreate(
            ['username' => 'kasir1'],
            [
                'password_hash' => Hash::make('password123'),
                'full_name' => 'Kasir Utama',
                'role' => 'kasir',
                'is_active' => true,
            ]
        );

        $dapur = User::firstOrCreate(
            ['username' => 'chef1'],
            [
                'password_hash' => Hash::make('password123'),
                'full_name' => 'Chef Dapur',
                'role' => 'dapur',
                'is_active' => true,
            ]
        );

        // 2. Default Dining Tables
        for ($i = 1; $i <= 10; $i++) {
            DiningTable::firstOrCreate(
                ['table_number' => "Meja $i"],
                [
                    'qr_code_token' => Str::random(32),
                    'status' => 'available',
                ]
            );
        }

        // 3. Default Categories
        $makanan = Category::firstOrCreate(['category_name' => 'Makanan']);
        $minuman = Category::firstOrCreate(['category_name' => 'Minuman']);
        $snack = Category::firstOrCreate(['category_name' => 'Snack & Dessert']);

        // 4. Sample Products
        Product::updateOrCreate(
            ['barcode' => '8991001'],
            [
                'category_id' => $makanan->id,
                'image_url' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
                'product_name' => 'Nasi Goreng Spesial',
                'cost_price' => 12000,
                'selling_price' => 20000,
                'stock_qty' => 50,
                'requires_kitchen' => true,
                'is_available' => true,
            ]
        );

        Product::updateOrCreate(
            ['barcode' => '8991002'],
            [
                'category_id' => $makanan->id,
                'image_url' => 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
                'product_name' => 'Mie Goreng Seafood',
                'cost_price' => 14000,
                'selling_price' => 23000,
                'stock_qty' => 40,
                'requires_kitchen' => true,
                'is_available' => true,
            ]
        );

        Product::updateOrCreate(
            ['barcode' => '8992001'],
            [
                'category_id' => $minuman->id,
                'image_url' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
                'product_name' => 'Es Teh Manis',
                'cost_price' => 1500,
                'selling_price' => 5000,
                'stock_qty' => 100,
                'requires_kitchen' => false,
                'is_available' => true,
            ]
        );

        Product::updateOrCreate(
            ['barcode' => '8992002'],
            [
                'category_id' => $minuman->id,
                'image_url' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
                'product_name' => 'Kopi Susu Gula Aren',
                'cost_price' => 6000,
                'selling_price' => 15000,
                'stock_qty' => 50,
                'requires_kitchen' => false,
                'is_available' => true,
            ]
        );

        Product::updateOrCreate(
            ['barcode' => '8993001'],
            [
                'category_id' => $snack->id,
                'image_url' => 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
                'product_name' => 'Kentang Goreng (French Fries)',
                'cost_price' => 7000,
                'selling_price' => 14000,
                'stock_qty' => 30,
                'requires_kitchen' => true,
                'is_available' => true,
            ]
        );

        // 5. Default System Settings & Cafe Profile
        SystemSetting::set('store_name', 'KASIR CAFE CANTEEN', 'general');
        SystemSetting::set('store_address', 'Jl. R.E. Martadinata No. 42, Ciamis', 'general');
        SystemSetting::set('store_phone', '0812-3456-7890', 'general');
        SystemSetting::set('receipt_footer', 'Terima Kasih Atas Kunjungan Anda! Harap Simpan Struk Sebagai Bukti Pembayaran Resmi.', 'general');
        SystemSetting::set('thermal_paper_width', '58mm', 'hardware');
        SystemSetting::set('qr_require_cashier_verification', true, 'security');
        SystemSetting::set('qr_rate_limit_per_minute', 3, 'security');
        SystemSetting::set('qr_table_pin_enabled', false, 'security');
        SystemSetting::set('maintenance_mode', false, 'system');

        // 6. Sample Operational Expenses
        OperationalExpense::firstOrCreate(
            ['expense_name' => 'Beli Es Batu Kristal 10 Bal'],
            [
                'user_id' => $admin->id,
                'amount' => 50000,
                'expense_date' => now()->toDateString(),
                'notes' => 'Pasokan es batu harian untuk bar minuman',
            ]
        );
        OperationalExpense::firstOrCreate(
            ['expense_name' => 'Beli Gas LPG 3Kg (2 Tabung)'],
            [
                'user_id' => $admin->id,
                'amount' => 44000,
                'expense_date' => now()->toDateString(),
                'notes' => 'Bahan bakar kompor dapur',
            ]
        );
    }
}
