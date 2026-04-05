<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\Permissions;
use api\components\permissions\ProjectPermissionService;
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
use common\models\Project;

class ProjectPermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID = '01900000-0000-7000-8000-000000000001'; // org1 owner
    private const USER2_ID = '01900000-0000-7000-8000-000000000002'; // org1 member
    private const USER3_ID = '01900000-0000-7000-8000-000000000003'; // org1 admin, org2 owner
    private const USER4_ID = '01900000-0000-7000-8000-000000000004'; // not a member of any org
    private const ORG1_ID  = '01900000-0000-7001-8000-000000000001';
    private const PROJ1_ID = '01900000-0000-7002-8000-000000000001'; // public, key: TEST
    private const PROJ2_ID = '01900000-0000-7002-8000-000000000002'; // private, key: PRIV
    private const PROJ3_ID = '01900000-0000-7002-8000-000000000003'; // team, key: TEAM

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
    // getProjectPermissions
    // -------------------------------------------------------------------------

    public function testGetProjectPermissionsForNonExistentProject()
    {
        $result = ProjectPermissionService::getProjectPermissions(
            '00000000-0000-0000-0000-000000000000',
            self::USER1_ID
        );
        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForNonOrgMember()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ1_ID, self::USER4_ID);
        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForMemberOnPublicProject()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ1_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ1_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertContains(Permissions::ISSUE_VIEW->value, $perms);
        $this->assertContains(Permissions::ISSUE_CREATE->value, $perms);
        $this->assertContains(Permissions::COMMENT_CREATE->value, $perms);

        $this->assertNotContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertNotContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForMemberOnTeamProject()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ3_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ3_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForMemberOnPrivateProjectWithoutMembership()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ2_ID, self::USER2_ID);
        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForOwnerOnPrivateProject()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ2_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ2_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForElevatedOrgMemberWithNoProjectRole()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ1_ID, self::USER3_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ1_ID];

        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertContains(Permissions::COMMENT_DELETE_ANY->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsIncludesKeyMapping()
    {
        $result = ProjectPermissionService::getProjectPermissions(self::PROJ1_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey('TEST', $result['project']);
        $this->assertSame($result['project'][self::PROJ1_ID], $result['project']['TEST']);
    }

    // -------------------------------------------------------------------------
    // getAllProjectPermissions
    // -------------------------------------------------------------------------

    public function testGetAllProjectPermissionsForNonOrgMember()
    {
        $result = ProjectPermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER4_ID);
        $this->assertSame([], $result);
    }

    public function testGetAllProjectPermissionsForElevatedUser()
    {
        $result = ProjectPermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey(self::PROJ1_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ2_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ3_ID, $result['project']);

        $this->assertArrayHasKey('TEST', $result['project']);
        $this->assertArrayHasKey('PRIV', $result['project']);
        $this->assertArrayHasKey('TEAM', $result['project']);
    }

    public function testGetAllProjectPermissionsForNonElevatedUser()
    {
        $result = ProjectPermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey(self::PROJ1_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ3_ID, $result['project']);
        $this->assertArrayNotHasKey(self::PROJ2_ID, $result['project']);
    }

    public function testGetAllProjectPermissionsReturnsCorrectPermissionsForAdmin()
    {
        $result = ProjectPermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER3_ID);

        $perms = $result['project'][self::PROJ1_ID];
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    // -------------------------------------------------------------------------
    // canDoInProject
    // -------------------------------------------------------------------------

    public function testCanDoInProjectForMemberWithViewPermission()
    {
        $this->assertTrue(
            ProjectPermissionService::canDoInProject(self::PROJ1_ID, self::USER2_ID, Permissions::ISSUE_VIEW)
        );
    }

    public function testCannotDoInProjectForNonMember()
    {
        $this->assertFalse(
            ProjectPermissionService::canDoInProject(self::PROJ1_ID, self::USER4_ID, Permissions::ISSUE_VIEW)
        );
    }

    public function testCanDoInProjectForAdminWithElevatedPermission()
    {
        $this->assertTrue(
            ProjectPermissionService::canDoInProject(self::PROJ1_ID, self::USER3_ID, Permissions::WORKTIME_DELETE_ANY)
        );
    }

    public function testCannotDoInProjectForMemberWithElevatedPermission()
    {
        $this->assertFalse(
            ProjectPermissionService::canDoInProject(self::PROJ1_ID, self::USER2_ID, Permissions::WORKTIME_DELETE_ANY)
        );
    }

    // -------------------------------------------------------------------------
    // canViewProject / canUpdateProject / canDeleteProject
    // -------------------------------------------------------------------------

    public function testCanViewProjectForMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(ProjectPermissionService::canViewProject($project, self::USER2_ID));
    }

    public function testCannotViewProjectForNonMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(ProjectPermissionService::canViewProject($project, self::USER4_ID));
    }

    public function testCanUpdateProjectForOwner()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(ProjectPermissionService::canUpdateProject($project, self::USER1_ID));
    }

    public function testCannotUpdateProjectForMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(ProjectPermissionService::canUpdateProject($project, self::USER2_ID));
    }

    public function testCanDeleteProjectForOwner()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(ProjectPermissionService::canDeleteProject($project, self::USER1_ID));
    }

    public function testCannotDeleteProjectForAdmin()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(ProjectPermissionService::canDeleteProject($project, self::USER3_ID));
    }

    // -------------------------------------------------------------------------
    // canCreateProject
    // -------------------------------------------------------------------------

    public function testCanCreateProjectForAdmin()
    {
        $this->assertTrue(ProjectPermissionService::canCreateProject(self::ORG1_ID, self::USER3_ID));
    }

    public function testCannotCreateProjectForMember()
    {
        $this->assertFalse(ProjectPermissionService::canCreateProject(self::ORG1_ID, self::USER2_ID));
    }

    // -------------------------------------------------------------------------
    // canViewProjectMembers / canManageProjectMembers
    // -------------------------------------------------------------------------

    public function testCanViewProjectMembersForMember()
    {
        $this->assertTrue(ProjectPermissionService::canViewProjectMembers(self::PROJ1_ID, self::USER2_ID));
    }

    public function testCannotViewProjectMembersForNonMember()
    {
        $this->assertFalse(ProjectPermissionService::canViewProjectMembers(self::PROJ1_ID, self::USER4_ID));
    }

    public function testCanManageProjectMembersForAdmin()
    {
        $this->assertTrue(ProjectPermissionService::canManageProjectMembers(self::PROJ1_ID, self::USER3_ID));
    }

    public function testCannotManageProjectMembersForMember()
    {
        $this->assertFalse(ProjectPermissionService::canManageProjectMembers(self::PROJ1_ID, self::USER2_ID));
    }

    // -------------------------------------------------------------------------
    // resolveRole
    // -------------------------------------------------------------------------

    public function testResolveRoleElevatedWithNoProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_ADMIN, null, Project::VISIBILITY_PRIVATE);
        $this->assertSame(RoleManager::ROLE_ADMIN, $result);
    }

    public function testResolveRoleElevatedWithHigherProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_ADMIN, RoleManager::ROLE_OWNER, Project::VISIBILITY_PUBLIC);
        $this->assertSame(RoleManager::ROLE_OWNER, $result);
    }

    public function testResolveRoleElevatedWithLowerProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_ADMIN, RoleManager::ROLE_MEMBER, Project::VISIBILITY_PUBLIC);
        $this->assertSame(RoleManager::ROLE_ADMIN, $result);
    }

    public function testResolveRoleNonElevatedPublicProjectNoProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_MEMBER, null, Project::VISIBILITY_PUBLIC);
        $this->assertSame(RoleManager::ROLE_MEMBER, $result);
    }

    public function testResolveRoleNonElevatedTeamProjectNoProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_MEMBER, null, Project::VISIBILITY_TEAM);
        $this->assertSame(RoleManager::ROLE_MEMBER, $result);
    }

    public function testResolveRoleNonElevatedPrivateProjectNoProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_MEMBER, null, Project::VISIBILITY_PRIVATE);
        $this->assertNull($result);
    }

    public function testResolveRoleNonElevatedPrivateProjectWithProjectRole()
    {
        $result = ProjectPermissionService::resolveRole(RoleManager::ROLE_MEMBER, RoleManager::ROLE_MEMBER, Project::VISIBILITY_PRIVATE);
        $this->assertSame(RoleManager::ROLE_MEMBER, $result);
    }

    // -------------------------------------------------------------------------
    // buildProjectPermissionsForRole
    // -------------------------------------------------------------------------

    public function testBuildProjectPermissionsForGuestRole()
    {
        $perms = ProjectPermissionService::buildProjectPermissionsForRole(RoleManager::ROLE_GUEST);

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertContains(Permissions::ISSUE_VIEW->value, $perms);
        $this->assertNotContains(Permissions::ISSUE_CREATE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_UPDATE->value, $perms);
    }

    public function testBuildProjectPermissionsForMemberRole()
    {
        $perms = ProjectPermissionService::buildProjectPermissionsForRole(RoleManager::ROLE_MEMBER);

        $this->assertContains(Permissions::ISSUE_CREATE->value, $perms);
        $this->assertContains(Permissions::ISSUE_UPDATE->value, $perms);
        $this->assertContains(Permissions::COMMENT_CREATE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertNotContains(Permissions::ISSUE_DELETE->value, $perms);
    }

    public function testBuildProjectPermissionsForAdminRole()
    {
        $perms = ProjectPermissionService::buildProjectPermissionsForRole(RoleManager::ROLE_ADMIN);

        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertContains(Permissions::COMMENT_DELETE_ANY->value, $perms);
        $this->assertContains(Permissions::WORKTIME_DELETE_ANY->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testBuildProjectPermissionsForOwnerRole()
    {
        $perms = ProjectPermissionService::buildProjectPermissionsForRole(RoleManager::ROLE_OWNER);

        $this->assertContains(Permissions::PROJECT_DELETE->value, $perms);
        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
    }
}
