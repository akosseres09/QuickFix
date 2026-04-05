<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\OrganizationPermissionService;
use api\components\permissions\Permissions;
use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\User;
use common\models\UserRole;
use Yii;

class OrganizationPermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID = '01900000-0000-7000-8000-000000000001'; // org1 owner
    private const USER2_ID = '01900000-0000-7000-8000-000000000002'; // org1 member
    private const USER3_ID = '01900000-0000-7000-8000-000000000003'; // org1 admin, org2 owner
    private const USER4_ID = '01900000-0000-7000-8000-000000000004'; // not a member of any org
    private const ORG1_ID  = '01900000-0000-7001-8000-000000000001'; // slug: test-org
    private const ORG2_ID  = '01900000-0000-7001-8000-000000000002'; // slug: second-org

    public function _fixtures(): array
    {
        return [
            'users'               => UserFixture::class,
            'organizations'       => OrganizationFixture::class,
            'organizationMembers' => OrganizationMemberFixture::class,
            'projects'            => ProjectFixture::class,
            'projectMembers'      => ProjectMemberFixture::class,
            'labels'              => LabelFixture::class,
            'issues'              => IssueFixture::class,
        ];
    }

    // -------------------------------------------------------------------------
    // getBasePermissions
    // -------------------------------------------------------------------------

    public function testGetBasePermissionsForAdmin()
    {
        $permissions = OrganizationPermissionService::getBasePermissions(UserRole::ADMIN);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);

        $basePermissions = $permissions['base'];

        $this->assertContains(Permissions::ORG_VIEW->value, $basePermissions);
        $this->assertContains(Permissions::ORG_UPDATE->value, $basePermissions);
        $this->assertContains(Permissions::ORG_DELETE->value, $basePermissions);
        $this->assertContains(Permissions::ORG_CREATE->value, $basePermissions);
        $this->assertContains(Permissions::USER_VIEW->value, $basePermissions);
        $this->assertContains(Permissions::USER_UPDATE->value, $basePermissions);
        $this->assertContains(Permissions::USER_DELETE->value, $basePermissions);
    }

    public function testGetBasePermissionsForRegularUserWithOrgMemberships()
    {
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $permissions = OrganizationPermissionService::getBasePermissions(UserRole::USER);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);
        $this->assertEmpty($permissions['base']);

        $this->assertArrayHasKey('org', $permissions);
        $this->assertArrayHasKey(self::ORG1_ID, $permissions['org']);

        $orgPerms = $permissions['org'][self::ORG1_ID];
        $this->assertContains(Permissions::ORG_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetBasePermissionsForRegularUserNotInAnyOrg()
    {
        $user = User::findOne(self::USER4_ID);
        Yii::$app->user->setIdentity($user);

        $permissions = OrganizationPermissionService::getBasePermissions(UserRole::USER);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);
        $this->assertEmpty($permissions['base']);
        $this->assertCount(1, $permissions);
    }

    // -------------------------------------------------------------------------
    // getOrganizationPermissions
    // -------------------------------------------------------------------------

    public function testGetOrganizationPermissionsForNonExistentOrg()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(
            '00000000-0000-0000-0000-000000000000',
            self::USER1_ID
        );
        $this->assertSame([], $result);
    }

    public function testGetOrganizationPermissionsForNonMember()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER4_ID);
        $this->assertSame([], $result);
    }

    public function testGetOrganizationPermissionsForGuestRole()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER4_ID, RoleManager::ROLE_GUEST);

        $this->assertArrayHasKey('org', $result);
        $orgPerms = $result['org'][self::ORG1_ID];

        $this->assertContains(Permissions::ORG_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::ORG_MEMBERS_VIEW->value, $orgPerms);
        $this->assertNotContains(Permissions::WORKTIME_VIEW->value, $orgPerms);
        $this->assertNotContains(Permissions::ORG_UPDATE->value, $orgPerms);
        $this->assertNotContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetOrganizationPermissionsForMemberRole()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER2_ID);

        $this->assertArrayHasKey('org', $result);
        $orgPerms = $result['org'][self::ORG1_ID];

        $this->assertContains(Permissions::ORG_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::ORG_MEMBERS_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::WORKTIME_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::WORKTIME_CREATE->value, $orgPerms);
        $this->assertNotContains(Permissions::ORG_UPDATE->value, $orgPerms);
        $this->assertNotContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetOrganizationPermissionsForAdminRole()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER3_ID);

        $this->assertArrayHasKey('org', $result);
        $orgPerms = $result['org'][self::ORG1_ID];

        $this->assertContains(Permissions::ORG_UPDATE->value, $orgPerms);
        $this->assertContains(Permissions::ORG_MEMBERS_MANAGE->value, $orgPerms);
        $this->assertContains(Permissions::ORG_MEMBER_INVITE->value, $orgPerms);
        $this->assertContains(Permissions::PROJECT_CREATE->value, $orgPerms);
        $this->assertNotContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetOrganizationPermissionsForOwnerRole()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('org', $result);
        $orgPerms = $result['org'][self::ORG1_ID];

        $this->assertContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetOrganizationPermissionsIncludesSlugKey()
    {
        $result = OrganizationPermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('test-org', $result['org']);
        $this->assertSame($result['org'][self::ORG1_ID], $result['org']['test-org']);
    }

    // -------------------------------------------------------------------------
    // canDoInOrganization
    // -------------------------------------------------------------------------

    public function testCanDoInOrganizationReturnsTrueForValidPermission()
    {
        $this->assertTrue(
            OrganizationPermissionService::canDoInOrganization(self::ORG1_ID, self::USER1_ID, Permissions::ORG_VIEW)
        );
    }

    public function testCanDoInOrganizationReturnsFalseForNonMember()
    {
        $this->assertFalse(
            OrganizationPermissionService::canDoInOrganization(self::ORG1_ID, self::USER4_ID, Permissions::ORG_VIEW)
        );
    }

    // -------------------------------------------------------------------------
    // Authorization helpers
    // -------------------------------------------------------------------------

    public function testCanViewOrganizationForMember()
    {
        $this->assertTrue(OrganizationPermissionService::canViewOrganization(self::ORG1_ID, self::USER2_ID));
    }

    public function testCannotViewOrganizationForNonMember()
    {
        $this->assertFalse(OrganizationPermissionService::canViewOrganization(self::ORG1_ID, self::USER4_ID));
    }

    public function testCanUpdateOrganizationForAdmin()
    {
        $this->assertTrue(OrganizationPermissionService::canUpdateOrganization(self::ORG1_ID, self::USER3_ID));
    }

    public function testCannotUpdateOrganizationForMember()
    {
        $this->assertFalse(OrganizationPermissionService::canUpdateOrganization(self::ORG1_ID, self::USER2_ID));
    }

    public function testCanDeleteOrganizationForOwner()
    {
        $this->assertTrue(OrganizationPermissionService::canDeleteOrganization(self::ORG1_ID, self::USER1_ID));
    }

    public function testCannotDeleteOrganizationForAdmin()
    {
        $this->assertFalse(OrganizationPermissionService::canDeleteOrganization(self::ORG1_ID, self::USER3_ID));
    }

    public function testCanViewOrgMembersForMember()
    {
        $this->assertTrue(OrganizationPermissionService::canViewOrgMembers(self::ORG1_ID, self::USER2_ID));
    }

    public function testCannotViewOrgMembersForNonMember()
    {
        $this->assertFalse(OrganizationPermissionService::canViewOrgMembers(self::ORG1_ID, self::USER4_ID));
    }

    public function testCanManageOrgMembersForAdmin()
    {
        $this->assertTrue(OrganizationPermissionService::canManageOrgMembers(self::ORG1_ID, self::USER3_ID));
    }

    public function testCannotManageOrgMembersForMember()
    {
        $this->assertFalse(OrganizationPermissionService::canManageOrgMembers(self::ORG1_ID, self::USER2_ID));
    }

    public function testCanInviteOrgMemberForAdmin()
    {
        $this->assertTrue(OrganizationPermissionService::canInviteOrgMember(self::ORG1_ID, self::USER3_ID));
    }

    public function testCannotInviteOrgMemberForMember()
    {
        $this->assertFalse(OrganizationPermissionService::canInviteOrgMember(self::ORG1_ID, self::USER2_ID));
    }

    public function testCanManageOrgInvitationForAdmin()
    {
        $this->assertTrue(OrganizationPermissionService::canManageOrgInvitation(self::ORG1_ID, self::USER3_ID));
    }

    public function testCannotManageOrgInvitationForMember()
    {
        $this->assertFalse(OrganizationPermissionService::canManageOrgInvitation(self::ORG1_ID, self::USER2_ID));
    }

    // -------------------------------------------------------------------------
    // buildOrgPermissionsForRole
    // -------------------------------------------------------------------------

    public function testBuildOrgPermissionsForGuestRole()
    {
        $perms = OrganizationPermissionService::buildOrgPermissionsForRole(RoleManager::ROLE_GUEST);

        $this->assertContains(Permissions::ORG_VIEW->value, $perms);
        $this->assertContains(Permissions::ORG_MEMBERS_VIEW->value, $perms);
        $this->assertNotContains(Permissions::WORKTIME_VIEW->value, $perms);
        $this->assertNotContains(Permissions::ORG_UPDATE->value, $perms);
    }

    public function testBuildOrgPermissionsForMemberRole()
    {
        $perms = OrganizationPermissionService::buildOrgPermissionsForRole(RoleManager::ROLE_MEMBER);

        $this->assertContains(Permissions::WORKTIME_VIEW->value, $perms);
        $this->assertContains(Permissions::WORKTIME_CREATE->value, $perms);
        $this->assertNotContains(Permissions::ORG_UPDATE->value, $perms);
    }

    public function testBuildOrgPermissionsForAdminRole()
    {
        $perms = OrganizationPermissionService::buildOrgPermissionsForRole(RoleManager::ROLE_ADMIN);

        $this->assertContains(Permissions::ORG_UPDATE->value, $perms);
        $this->assertContains(Permissions::ORG_MEMBERS_MANAGE->value, $perms);
        $this->assertContains(Permissions::PROJECT_CREATE->value, $perms);
        $this->assertNotContains(Permissions::ORG_DELETE->value, $perms);
    }

    public function testBuildOrgPermissionsForOwnerRole()
    {
        $perms = OrganizationPermissionService::buildOrgPermissionsForRole(RoleManager::ROLE_OWNER);

        $this->assertContains(Permissions::ORG_DELETE->value, $perms);
        $this->assertContains(Permissions::ORG_UPDATE->value, $perms);
        $this->assertContains(Permissions::WORKTIME_VIEW->value, $perms);
    }
}
