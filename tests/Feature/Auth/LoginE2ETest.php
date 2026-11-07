<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginE2ETest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $cashierUser;

    protected User $chefUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'username' => 'admin',
            'full_name' => 'Administrator POS',
            'role' => 'admin',
            'password_hash' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->cashierUser = User::factory()->create([
            'username' => 'kasir1',
            'full_name' => 'Kasir Utama',
            'role' => 'kasir',
            'password_hash' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->chefUser = User::factory()->create([
            'username' => 'chef1',
            'full_name' => 'Head Chef Dapur',
            'role' => 'dapur',
            'password_hash' => Hash::make('password123'),
            'is_active' => true,
        ]);
    }

    /**
     * 1. GET /login as a guest should render the Login page with demo accounts
     */
    public function test_login_page_renders_successfully_for_guest(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->has('demo_accounts', 3)
            ->where('demo_accounts.0.role', 'admin')
            ->where('demo_accounts.1.role', 'kasir')
            ->where('demo_accounts.2.role', 'dapur')
        );
    }

    /**
     * 2. Authenticated users visiting /login must be redirected to their role dashboards
     */
    public function test_authenticated_users_visiting_login_are_redirected_to_their_home(): void
    {
        $responseAdmin = $this->actingAs($this->adminUser)->get('/login');
        $responseAdmin->assertRedirect(route('admin.dashboard'));

        $responseCashier = $this->actingAs($this->cashierUser)->get('/login');
        $responseCashier->assertRedirect(route('cashier.pos'));

        $responseChef = $this->actingAs($this->chefUser)->get('/login');
        $responseChef->assertRedirect(route('kitchen.display'));
    }

    /**
     * 3. Successful login for Administrator -> redirects to /admin
     */
    public function test_admin_can_login_with_valid_credentials(): void
    {
        $response = $this->post('/login', [
            'username' => 'admin',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertStatus(302);
        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($this->adminUser);
        $response->assertSessionHas('success');
    }

    /**
     * 4. Successful login for Kasir -> redirects to /pos
     */
    public function test_cashier_can_login_with_valid_credentials(): void
    {
        $response = $this->post('/login', [
            'username' => 'kasir1',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertStatus(302);
        $response->assertRedirect(route('cashier.pos'));
        $this->assertAuthenticatedAs($this->cashierUser);
        $response->assertSessionHas('success');
    }

    /**
     * 5. Successful login for Koki Dapur -> redirects to /kitchen
     */
    public function test_chef_can_login_with_valid_credentials(): void
    {
        $response = $this->post('/login', [
            'username' => 'chef1',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertStatus(302);
        $response->assertRedirect(route('kitchen.display'));
        $this->assertAuthenticatedAs($this->chefUser);
        $response->assertSessionHas('success');
    }

    /**
     * 6. Login fails with incorrect password
     */
    public function test_login_fails_with_incorrect_password(): void
    {
        $response = $this->from('/login')->post('/login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['username']);
        $this->assertGuest();
    }

    /**
     * 7. Login fails with non-existent username
     */
    public function test_login_fails_with_non_existent_username(): void
    {
        $response = $this->from('/login')->post('/login', [
            'username' => 'ghost_user',
            'password' => 'password123',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['username']);
        $this->assertGuest();
    }

    /**
     * 8. Inactive user cannot log in
     */
    public function test_inactive_user_is_blocked_from_login(): void
    {
        $inactiveStaff = User::factory()->create([
            'username' => 'staff_banned',
            'password_hash' => Hash::make('password123'),
            'is_active' => false,
        ]);

        $response = $this->from('/login')->post('/login', [
            'username' => 'staff_banned',
            'password' => 'password123',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['username' => 'Akun Anda dinonaktifkan. Hubungi administrator.']);
        $this->assertGuest();
    }

    /**
     * 9. Validation: username and password are required
     */
    public function test_login_requires_username_and_password(): void
    {
        $response = $this->post('/login', [
            'username' => '',
            'password' => '',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['username', 'password']);
        $this->assertGuest();
    }

    /**
     * 10. Authenticated user can log out
     */
    public function test_authenticated_user_can_logout(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/logout');

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    /**
     * 11. Guest cannot call /logout
     */
    public function test_guest_cannot_call_logout(): void
    {
        $response = $this->post('/logout');

        $response->assertStatus(302);
        $response->assertRedirect(route('login'));
    }

    /**
     * 12. Root URL (/) role redirection
     */
    public function test_root_url_redirects_based_on_auth_role(): void
    {
        // Guest visits / -> sees landing Welcome page
        $guestResp = $this->get('/');
        $guestResp->assertStatus(200);
        $guestResp->assertInertia(fn ($page) => $page->component('Welcome'));

        // Admin visits / -> redirected to /admin
        $adminResp = $this->actingAs($this->adminUser)->get('/');
        $adminResp->assertRedirect(route('admin.dashboard'));

        // Cashier visits / -> redirected to /pos
        $cashierResp = $this->actingAs($this->cashierUser)->get('/');
        $cashierResp->assertRedirect(route('cashier.pos'));

        // Chef visits / -> redirected to /kitchen
        $chefResp = $this->actingAs($this->chefUser)->get('/');
        $chefResp->assertRedirect(route('kitchen.display'));
    }

    /**
     * 13. Unauthenticated access to protected routes redirects to /login
     */
    public function test_unauthenticated_access_to_protected_routes_redirects_to_login(): void
    {
        $this->get('/admin')->assertRedirect(route('login'));
        $this->get('/admin/products')->assertRedirect(route('login'));
        $this->get('/admin/users')->assertRedirect(route('login'));
        $this->get('/pos')->assertRedirect(route('login'));
        $this->get('/kitchen')->assertRedirect(route('login'));
        $this->get('/tables')->assertRedirect(route('login'));
    }

    /**
     * 14. Role boundary enforcement (Strict Role Isolation)
     */
    public function test_role_boundary_enforcement(): void
    {
        // Cashier trying to access admin area -> redirected to POS with warning
        $cashierAdmin = $this->actingAs($this->cashierUser)->get('/admin');
        $cashierAdmin->assertRedirect(route('cashier.pos'));
        $cashierAdmin->assertSessionHas('error');

        // Chef trying to access admin area -> redirected to Kitchen with warning
        $chefAdmin = $this->actingAs($this->chefUser)->get('/admin');
        $chefAdmin->assertRedirect(route('kitchen.display'));
        $chefAdmin->assertSessionHas('error');

        // Admin trying to access cashier POS -> redirected to Admin dashboard with notice
        $adminPos = $this->actingAs($this->adminUser)->get('/pos');
        $adminPos->assertRedirect(route('admin.dashboard'));
        $adminPos->assertSessionHas('error');

        // Admin trying to access kitchen display -> redirected to Admin dashboard with notice
        $adminKitchen = $this->actingAs($this->adminUser)->get('/kitchen');
        $adminKitchen->assertRedirect(route('admin.dashboard'));
        $adminKitchen->assertSessionHas('error');
    }
}
