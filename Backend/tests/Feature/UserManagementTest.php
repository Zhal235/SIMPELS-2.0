<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_list_users()
    {
        $u = User::factory()->create(['role' => 'user']);
        $this->actingAs($u, 'sanctum');
        $res = $this->getJson('/api/v1/users');
        $res->assertStatus(403);
    }

    public function test_admin_can_list_users()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(2)->create();
        $this->actingAs($admin, 'sanctum');
        $res = $this->getJson('/api/v1/users');
        $res->assertStatus(200)->assertJson(['success' => true]);
    }
}
