<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use api\tests\UnitTester;

class RoleManagerTest extends Unit
{
    protected UnitTester $tester;

    public function testGetWeightForGuest()
    {
        $weight = RoleManager::getWeight(RoleManager::ROLE_GUEST);

        $this->assertEquals(10, $weight);
    }

    public function testGetWeightForMember()
    {
        $weight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);

        $this->assertEquals(20, $weight);
    }

    public function testGetWeightForAdmin()
    {
        $weight = RoleManager::getWeight(RoleManager::ROLE_ADMIN);

        $this->assertEquals(30, $weight);
    }

    public function testGetWeightForOwner()
    {
        $weight = RoleManager::getWeight(RoleManager::ROLE_OWNER);

        $this->assertEquals(40, $weight);
    }

    public function testGetWeightForNull()
    {
        $weight = RoleManager::getWeight(null);

        $this->assertEquals(0, $weight);
    }

    public function testGetWeightForInvalidRole()
    {
        $weight = RoleManager::getWeight('invalid-role');

        $this->assertEquals(0, $weight);
    }

    public function testRoleHierarchy()
    {
        // Verify the hierarchy: guest < member < admin < owner
        $guestWeight = RoleManager::getWeight(RoleManager::ROLE_GUEST);
        $memberWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
        $adminWeight = RoleManager::getWeight(RoleManager::ROLE_ADMIN);
        $ownerWeight = RoleManager::getWeight(RoleManager::ROLE_OWNER);

        $this->assertLessThan($memberWeight, $guestWeight);
        $this->assertLessThan($adminWeight, $memberWeight);
        $this->assertLessThan($ownerWeight, $adminWeight);
    }

    public function testRoleListConstant()
    {
        $expectedRoles = ['guest', 'member', 'admin', 'owner'];

        $this->assertEquals($expectedRoles, RoleManager::ROLE_LIST);
        $this->assertCount(4, RoleManager::ROLE_LIST);
    }

    public function testAllRolesInListHaveWeights()
    {
        foreach (RoleManager::ROLE_LIST as $role) {
            $weight = RoleManager::getWeight($role);

            $this->assertGreaterThan(0, $weight, "Role '{$role}' should have a weight > 0");
        }
    }

    public function testCompareRoles()
    {
        // Test that we can compare roles by weight
        $this->assertTrue(
            RoleManager::getWeight(RoleManager::ROLE_ADMIN) > RoleManager::getWeight(RoleManager::ROLE_MEMBER),
            'Admin should have higher weight than member'
        );

        $this->assertTrue(
            RoleManager::getWeight(RoleManager::ROLE_OWNER) >= RoleManager::getWeight(RoleManager::ROLE_ADMIN),
            'Owner should have equal or higher weight than admin'
        );

        $this->assertTrue(
            RoleManager::getWeight(RoleManager::ROLE_MEMBER) > RoleManager::getWeight(RoleManager::ROLE_GUEST),
            'Member should have higher weight than guest'
        );
    }

    public function testRoleConstantsExist()
    {
        // Verify all role constants are defined
        $this->assertEquals('guest', RoleManager::ROLE_GUEST);
        $this->assertEquals('member', RoleManager::ROLE_MEMBER);
        $this->assertEquals('admin', RoleManager::ROLE_ADMIN);
        $this->assertEquals('owner', RoleManager::ROLE_OWNER);
    }

    public function testWeightIsUnique()
    {
        $weights = [];
        foreach (RoleManager::ROLE_LIST as $role) {
            $weight = RoleManager::getWeight($role);
            $weights[] = $weight;
        }

        // All weights should be unique
        $this->assertCount(4, array_unique($weights), 'All role weights should be unique');
    }

    public function testWeightIsConsistent()
    {
        // Calling getWeight multiple times for the same role should return the same value
        $role = RoleManager::ROLE_ADMIN;

        $weight1 = RoleManager::getWeight($role);
        $weight2 = RoleManager::getWeight($role);
        $weight3 = RoleManager::getWeight($role);

        $this->assertEquals($weight1, $weight2);
        $this->assertEquals($weight2, $weight3);
    }

    public function testCaseSensitivity()
    {
        // The match expression should be case-sensitive
        $this->assertEquals(30, RoleManager::getWeight('admin'));
        $this->assertEquals(0, RoleManager::getWeight('Admin'));
        $this->assertEquals(0, RoleManager::getWeight('ADMIN'));
    }
}
