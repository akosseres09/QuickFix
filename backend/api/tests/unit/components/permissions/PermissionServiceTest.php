<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\PermissionService;
use api\components\permissions\Permissions;
use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\models\UserRole;

class PermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    public function testGetBasePermissionsForAdmin()
    {
        $permissions = PermissionService::getBasePermissions(UserRole::ADMIN);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);

        $basePermissions = $permissions['base'];

        // Admin should have all base permissions
        $this->assertContains(Permissions::ORG_VIEW->value, $basePermissions);
        $this->assertContains(Permissions::ORG_UPDATE->value, $basePermissions);
        $this->assertContains(Permissions::ORG_DELETE->value, $basePermissions);
        $this->assertContains(Permissions::ORG_CREATE->value, $basePermissions);
        $this->assertContains(Permissions::USER_VIEW->value, $basePermissions);
        $this->assertContains(Permissions::USER_UPDATE->value, $basePermissions);
        $this->assertContains(Permissions::USER_DELETE->value, $basePermissions);
    }

    public function testRoleManagerWeightComparison()
    {
        // Test role comparison using weights
        $guestWeight = RoleManager::getWeight(RoleManager::ROLE_GUEST);
        $memberWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
        $adminWeight = RoleManager::getWeight(RoleManager::ROLE_ADMIN);
        $ownerWeight = RoleManager::getWeight(RoleManager::ROLE_OWNER);

        // Verify hierarchy
        $this->assertLessThan($memberWeight, $guestWeight);
        $this->assertLessThan($adminWeight, $memberWeight);
        $this->assertLessThan($ownerWeight, $adminWeight);
    }

    public function testRoleManagerGetWeightForAllRoles()
    {
        $roles = [
            RoleManager::ROLE_GUEST => 10,
            RoleManager::ROLE_MEMBER => 20,
            RoleManager::ROLE_ADMIN => 30,
            RoleManager::ROLE_OWNER => 40,
        ];

        foreach ($roles as $role => $expectedWeight) {
            $weight = RoleManager::getWeight($role);
            $this->assertEquals(
                $expectedWeight,
                $weight,
                "Role '{$role}' should have weight {$expectedWeight}"
            );
        }
    }

    public function testRoleManagerReturnsZeroForUnknownRole()
    {
        $weight = RoleManager::getWeight('unknown-role');
        $this->assertEquals(0, $weight);
    }

    public function testPermissionsEnumValues()
    {
        // Test that permission enum values follow the expected pattern
        $this->assertEquals('user.view', Permissions::USER_VIEW->value);
        $this->assertEquals('user.update', Permissions::USER_UPDATE->value);
        $this->assertEquals('user.delete', Permissions::USER_DELETE->value);

        $this->assertEquals('organization.view', Permissions::ORG_VIEW->value);
        $this->assertEquals('organization.create', Permissions::ORG_CREATE->value);
        $this->assertEquals('organization.update', Permissions::ORG_UPDATE->value);
        $this->assertEquals('organization.delete', Permissions::ORG_DELETE->value);

        $this->assertEquals('project.view', Permissions::PROJECT_VIEW->value);
        $this->assertEquals('project.create', Permissions::PROJECT_CREATE->value);
        $this->assertEquals('project.update', Permissions::PROJECT_UPDATE->value);
        $this->assertEquals('project.delete', Permissions::PROJECT_DELETE->value);

        $this->assertEquals('issue.view', Permissions::ISSUE_VIEW->value);
        $this->assertEquals('issue.create', Permissions::ISSUE_CREATE->value);
        $this->assertEquals('issue.update', Permissions::ISSUE_UPDATE->value);
        $this->assertEquals('issue.delete', Permissions::ISSUE_DELETE->value);
    }

    public function testPermissionsEnumInstanceOf()
    {
        $permission = Permissions::USER_VIEW;

        $this->assertInstanceOf(Permissions::class, $permission);
        $this->assertEquals('user.view', $permission->value);
    }

    public function testAllPermissionsAreAccessible()
    {
        // Get all permission cases
        $allPermissions = Permissions::cases();

        // Should have multiple permissions defined
        $this->assertGreaterThan(10, count($allPermissions));

        // Each should be a Permissions enum instance
        foreach ($allPermissions as $permission) {
            $this->assertInstanceOf(Permissions::class, $permission);
            $this->assertNotEmpty($permission->value);
        }
    }

    public function testOrganizationPermissions()
    {
        // Test that organization permissions exist
        $orgPermissions = [
            Permissions::ORG_VIEW,
            Permissions::ORG_CREATE,
            Permissions::ORG_UPDATE,
            Permissions::ORG_DELETE,
            Permissions::ORG_MEMBERS_VIEW,
            Permissions::ORG_MEMBERS_MANAGE,
            Permissions::ORG_MEMBER_INVITE,
        ];

        foreach ($orgPermissions as $permission) {
            $this->assertInstanceOf(Permissions::class, $permission);
            $this->assertStringStartsWith('organization.', $permission->value);
        }
    }

    public function testProjectPermissions()
    {
        $projectPermissions = [
            Permissions::PROJECT_CREATE,
            Permissions::PROJECT_VIEW,
            Permissions::PROJECT_UPDATE,
            Permissions::PROJECT_DELETE,
            Permissions::PROJECT_MEMBERS_VIEW,
            Permissions::PROJECT_MEMBERS_MANAGE,
            Permissions::PROJECT_MEMBER_INVITE,
        ];

        foreach ($projectPermissions as $permission) {
            $this->assertInstanceOf(Permissions::class, $permission);
            $this->assertStringStartsWith('project.', $permission->value);
        }
    }

    public function testCommentPermissions()
    {
        $commentPermissions = [
            Permissions::COMMENT_VIEW,
            Permissions::COMMENT_CREATE,
            Permissions::COMMENT_UPDATE,
            Permissions::COMMENT_DELETE_ANY,
            Permissions::COMMENT_UPDATE_ANY,
        ];

        foreach ($commentPermissions as $permission) {
            $this->assertInstanceOf(Permissions::class, $permission);
            $this->assertStringStartsWith('comment.', $permission->value);
        }
    }

    public function testWorktimePermissions()
    {
        $worktimePermissions = [
            Permissions::WORKTIME_VIEW,
            Permissions::WORKTIME_CREATE,
            Permissions::WORKTIME_VIEW_ANY,
            Permissions::WORKTIME_UPDATE_ANY,
            Permissions::WORKTIME_DELETE_ANY,
        ];

        foreach ($worktimePermissions as $permission) {
            $this->assertInstanceOf(Permissions::class, $permission);
            $this->assertStringStartsWith('worktime.', $permission->value);
        }
    }

    public function testPermissionValueUniqueness()
    {
        $allPermissions = Permissions::cases();
        $values = array_map(fn($p) => $p->value, $allPermissions);

        // All permission values should be unique
        $this->assertCount(
            count(array_unique($values)),
            $values,
            'All permission values should be unique'
        );
    }

    public function testRoleListIsComplete()
    {
        $roleList = RoleManager::ROLE_LIST;

        $this->assertContains(RoleManager::ROLE_GUEST, $roleList);
        $this->assertContains(RoleManager::ROLE_MEMBER, $roleList);
        $this->assertContains(RoleManager::ROLE_ADMIN, $roleList);
        $this->assertContains(RoleManager::ROLE_OWNER, $roleList);

        $this->assertCount(4, $roleList);
    }

    public function testElevatedRoleDetection()
    {
        // Admin and Owner are elevated roles
        $adminWeight = RoleManager::getWeight(RoleManager::ROLE_ADMIN);
        $ownerWeight = RoleManager::getWeight(RoleManager::ROLE_OWNER);
        $memberWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
        $guestWeight = RoleManager::getWeight(RoleManager::ROLE_GUEST);

        $adminThreshold = RoleManager::getWeight(RoleManager::ROLE_ADMIN);

        // Elevated roles
        $this->assertGreaterThanOrEqual($adminThreshold, $adminWeight);
        $this->assertGreaterThanOrEqual($adminThreshold, $ownerWeight);

        // Non-elevated roles
        $this->assertLessThan($adminThreshold, $memberWeight);
        $this->assertLessThan($adminThreshold, $guestWeight);
    }
}
