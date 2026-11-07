<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'username' => 'admin_settings_test',
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'kasir',
            'username' => 'kasir_settings_test',
        ]);
    }

    public function test_admin_can_access_settings_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/settings');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings')
            ->has('system_info')
            ->has('database_info')
            ->has('security_settings')
            ->has('logs')
        );
    }

    public function test_non_admin_cannot_access_settings_page(): void
    {
        $response = $this->actingAs($this->cashier)->get('/admin/settings');
        $response->assertStatus(403);
    }

    public function test_admin_can_update_security_settings(): void
    {
        $payload = [
            'qr_auto_rotate_token' => true,
            'qr_require_cashier_verification' => true,
            'qr_rate_limit_per_minute' => 5,
            'qr_table_pin_enabled' => true,
            'qr_table_pin_code' => '9988',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/settings/security', $payload);
        $response->assertStatus(302);

        $this->assertTrue(SystemSetting::get('qr_auto_rotate_token'));
        $this->assertTrue(SystemSetting::get('qr_require_cashier_verification'));
        $this->assertEquals(5, (int) SystemSetting::get('qr_rate_limit_per_minute'));
        $this->assertTrue(SystemSetting::get('qr_table_pin_enabled'));
        $this->assertEquals('9988', SystemSetting::get('qr_table_pin_code'));
    }

    public function test_admin_can_run_allowed_artisan_command(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/settings/artisan', [
            'command' => 'optimize:clear',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
    }

    public function test_admin_cannot_run_forbidden_artisan_command(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/settings/artisan', [
            'command' => 'migrate:fresh',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('error');
    }

    public function test_admin_can_clear_system_logs(): void
    {
        $logPath = storage_path('logs/laravel.log');
        File::ensureDirectoryExists(dirname($logPath));
        File::put($logPath, '[2026-11-07 10:00:00] local.ERROR: Test error message');

        $this->assertStringContainsString('Test error message', File::get($logPath));

        $response = $this->actingAs($this->admin)->post('/admin/settings/clear-logs');
        $response->assertStatus(302);

        $this->assertEmpty(File::get($logPath));
    }

    public function test_admin_can_regenerate_all_qr_tokens(): void
    {
        $table1 = DiningTable::create([
            'table_number' => 'M-01',
            'qr_code_token' => 'token_old_111',
            'status' => 'available',
        ]);

        $table2 = DiningTable::create([
            'table_number' => 'M-02',
            'qr_code_token' => 'token_old_222',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->admin)->post('/admin/settings/regenerate-all-qr');
        $response->assertStatus(302);

        $this->assertNotEquals('token_old_111', $table1->fresh()->qr_code_token);
        $this->assertNotEquals('token_old_222', $table2->fresh()->qr_code_token);
    }

    public function test_maintenance_mode_blocks_guest_and_cashier_but_allows_admin(): void
    {
        SystemSetting::set('maintenance_mode', true);
        SystemSetting::set('maintenance_message', 'Kantin sedang tutup untuk renovasi.');

        // Guest is blocked
        $guestResponse = $this->get('/');
        $guestResponse->assertStatus(503);

        // Cashier is blocked
        $cashierResponse = $this->actingAs($this->cashier)->get('/pos');
        $cashierResponse->assertStatus(503);

        // Admin can still access
        $adminResponse = $this->actingAs($this->admin)->get('/admin');
        $adminResponse->assertStatus(200);

        // Admin can toggle it off
        $toggleResponse = $this->actingAs($this->admin)->post('/admin/settings/maintenance', [
            'maintenance_mode' => false,
            'maintenance_message' => 'Normal',
        ]);
        $toggleResponse->assertStatus(302);

        // Now cashier is allowed again
        $cashierAllowedResponse = $this->actingAs($this->cashier)->get('/pos');
        $cashierAllowedResponse->assertStatus(200);
    }
}
