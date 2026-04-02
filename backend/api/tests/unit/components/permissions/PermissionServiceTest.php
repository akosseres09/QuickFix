<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\PermissionService;
use api\components\permissions\Permissions;
use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\CommentFixture;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Comment;
use common\models\Issue;
use common\models\Project;
use common\models\User;
use common\models\UserRole;
use Yii;

class PermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    // ---------------------------------------------------------------------------
    // Fixture IDs (aligned with common/tests/_data/)
    // ---------------------------------------------------------------------------

    private const USER1_ID    = '01900000-0000-0000-0000-000000000001'; // org1 owner
    private const USER2_ID    = '01900000-0000-0000-0000-000000000002'; // org1 member
    private const USER3_ID    = '01900000-0000-0000-0000-000000000003'; // org1 admin, org2 owner
    private const USER4_ID    = '01900000-0000-0000-0000-000000000004'; // not a member of any org
    private const ORG1_ID     = '01900000-0000-0001-0000-000000000001'; // slug: test-org
    private const ORG2_ID     = '01900000-0000-0001-0000-000000000002'; // slug: second-org
    private const PROJ1_ID    = '01900000-0000-0002-0000-000000000001'; // public,  key: TEST
    private const PROJ2_ID    = '01900000-0000-0002-0000-000000000002'; // private, key: PRIV
    private const PROJ3_ID    = '01900000-0000-0002-0000-000000000003'; // team,    key: TEAM
    private const ISSUE1_ID   = '01900000-0000-0004-0000-000000000001'; // in proj1
    private const COMMENT1_ID = '01900000-0000-0005-0000-000000000001'; // issue1, created_by user2
    private const COMMENT2_ID = '01900000-0000-0005-0000-000000000002'; // issue1, created_by user1

    // ---------------------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------------------

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
            'comments'            => CommentFixture::class,
        ];
    }

    // ---------------------------------------------------------------------------
    // getBasePermissions
    // ---------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------
    // getBasePermissions – regular user path (DB required)
    // ---------------------------------------------------------------------------

    public function testGetBasePermissionsForRegularUserWithOrgMemberships()
    {
        // user1 is OWNER of org1; set them as the current identity
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $permissions = PermissionService::getBasePermissions(UserRole::USER);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);
        $this->assertEmpty($permissions['base']);

        // Org-level permissions should be present for the org they own
        $this->assertArrayHasKey('org', $permissions);
        $this->assertArrayHasKey(self::ORG1_ID, $permissions['org']);

        $orgPerms = $permissions['org'][self::ORG1_ID];
        $this->assertContains(Permissions::ORG_VIEW->value, $orgPerms);
        $this->assertContains(Permissions::ORG_DELETE->value, $orgPerms); // owner-only
    }

    public function testGetBasePermissionsForRegularUserNotInAnyOrg()
    {
        // user4 has no org memberships
        $user = User::findOne(self::USER4_ID);
        Yii::$app->user->setIdentity($user);

        $permissions = PermissionService::getBasePermissions(UserRole::USER);

        $this->assertIsArray($permissions);
        $this->assertArrayHasKey('base', $permissions);
        $this->assertEmpty($permissions['base']);
        $this->assertCount(1, $permissions); // only 'base' key
    }

    // ---------------------------------------------------------------------------
    // getOrganizationPermissions
    // ---------------------------------------------------------------------------

    public function testGetOrganizationPermissionsForNonExistentOrg()
    {
        $result = PermissionService::getOrganizationPermissions(
            '00000000-0000-0000-0000-000000000000',
            self::USER1_ID
        );

        $this->assertSame([], $result);
    }

    public function testGetOrganizationPermissionsForNonMember()
    {
        // user4 has no membership in org1
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER4_ID);

        $this->assertSame([], $result);
    }

    public function testGetOrganizationPermissionsForGuestRole()
    {
        // Pass 'guest' explicitly to exercise the guest branch
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER4_ID, RoleManager::ROLE_GUEST);

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
        // user2 is MEMBER in org1
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER2_ID);

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
        // user3 is ADMIN in org1
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER3_ID);

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
        // user1 is OWNER in org1
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('org', $result);
        $orgPerms = $result['org'][self::ORG1_ID];

        $this->assertContains(Permissions::ORG_DELETE->value, $orgPerms);
    }

    public function testGetOrganizationPermissionsIncludesSlugKey()
    {
        $result = PermissionService::getOrganizationPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('test-org', $result['org']);
        $this->assertSame($result['org'][self::ORG1_ID], $result['org']['test-org']);
    }

    // ---------------------------------------------------------------------------
    // getProjectPermissions
    // ---------------------------------------------------------------------------

    public function testGetProjectPermissionsForNonExistentProject()
    {
        $result = PermissionService::getProjectPermissions(
            '00000000-0000-0000-0000-000000000000',
            self::USER1_ID
        );

        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForNonOrgMember()
    {
        // user4 is not in org1 which owns proj1
        $result = PermissionService::getProjectPermissions(self::PROJ1_ID, self::USER4_ID);

        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForMemberOnPublicProject()
    {
        // user2: org1=MEMBER, proj1=MEMBER, proj1 visibility=PUBLIC
        $result = PermissionService::getProjectPermissions(self::PROJ1_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ1_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertContains(Permissions::ISSUE_VIEW->value, $perms);
        $this->assertContains(Permissions::ISSUE_CREATE->value, $perms);
        $this->assertContains(Permissions::COMMENT_CREATE->value, $perms);

        // Member-level does NOT have moderator permissions
        $this->assertNotContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertNotContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForMemberOnTeamProject()
    {
        // user2: org1=MEMBER, proj3=MEMBER, proj3 visibility=TEAM
        $result = PermissionService::getProjectPermissions(self::PROJ3_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ3_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForMemberOnPrivateProjectWithoutMembership()
    {
        // user2 is NOT in project_member for proj2, and is non-elevated in org1
        // proj2 visibility=PRIVATE → no access
        $result = PermissionService::getProjectPermissions(self::PROJ2_ID, self::USER2_ID);

        $this->assertSame([], $result);
    }

    public function testGetProjectPermissionsForOwnerOnPrivateProject()
    {
        // user1: org1=OWNER (elevated), proj2=OWNER (project member)
        $result = PermissionService::getProjectPermissions(self::PROJ2_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ2_ID];

        $this->assertContains(Permissions::PROJECT_VIEW->value, $perms);
        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsForElevatedOrgMemberWithNoProjectRole()
    {
        // user3: org1=ADMIN (elevated), no project_member row → falls back to org role (admin)
        $result = PermissionService::getProjectPermissions(self::PROJ1_ID, self::USER3_ID);

        $this->assertArrayHasKey('project', $result);
        $perms = $result['project'][self::PROJ1_ID];

        $this->assertContains(Permissions::PROJECT_UPDATE->value, $perms);
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertContains(Permissions::COMMENT_DELETE_ANY->value, $perms);

        // Admin (not owner) → no PROJECT_DELETE
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    public function testGetProjectPermissionsIncludesKeyMapping()
    {
        $result = PermissionService::getProjectPermissions(self::PROJ1_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey('TEST', $result['project']);
        $this->assertSame($result['project'][self::PROJ1_ID], $result['project']['TEST']);
    }

    // ---------------------------------------------------------------------------
    // getAllProjectPermissions
    // ---------------------------------------------------------------------------

    public function testGetAllProjectPermissionsForNonOrgMember()
    {
        $result = PermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER4_ID);

        $this->assertSame([], $result);
    }

    public function testGetAllProjectPermissionsForElevatedUser()
    {
        // user1: org1=OWNER (elevated) → sees ALL projects in org1 (public, private, team)
        $result = PermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER1_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey(self::PROJ1_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ2_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ3_ID, $result['project']);

        // Keys are also mapped
        $this->assertArrayHasKey('TEST', $result['project']);
        $this->assertArrayHasKey('PRIV', $result['project']);
        $this->assertArrayHasKey('TEAM', $result['project']);
    }

    public function testGetAllProjectPermissionsForNonElevatedUser()
    {
        // user2: org1=MEMBER (non-elevated), member of proj1 (public) and proj3 (team)
        // Accessible: proj1 (public visibility), proj3 (in explicitProjectIds)
        $result = PermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER2_ID);

        $this->assertArrayHasKey('project', $result);
        $this->assertArrayHasKey(self::PROJ1_ID, $result['project']);
        $this->assertArrayHasKey(self::PROJ3_ID, $result['project']);

        // Private project with no membership → not included
        $this->assertArrayNotHasKey(self::PROJ2_ID, $result['project']);
    }

    public function testGetAllProjectPermissionsReturnsCorrectPermissionsForOwner()
    {
        // user3: org1=ADMIN, no project memberships → all projects with admin-level perms
        $result = PermissionService::getAllProjectPermissions(self::ORG1_ID, self::USER3_ID);

        $perms = $result['project'][self::PROJ1_ID];
        $this->assertContains(Permissions::ISSUE_DELETE->value, $perms);
        $this->assertNotContains(Permissions::PROJECT_DELETE->value, $perms);
    }

    // ---------------------------------------------------------------------------
    // canViewProject / canUpdateProject / canDeleteProject
    // ---------------------------------------------------------------------------

    public function testCanViewProjectForMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(PermissionService::canViewProject($project, self::USER2_ID));
    }

    public function testCannotViewProjectForNonMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(PermissionService::canViewProject($project, self::USER4_ID));
    }

    public function testCanUpdateProjectForOwner()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(PermissionService::canUpdateProject($project, self::USER1_ID));
    }

    public function testCannotUpdateProjectForMember()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(PermissionService::canUpdateProject($project, self::USER2_ID));
    }

    public function testCanDeleteProjectForOwner()
    {
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertTrue(PermissionService::canDeleteProject($project, self::USER1_ID));
    }

    public function testCannotDeleteProjectForAdmin()
    {
        // user3 is org-admin in proj1: has PROJECT_UPDATE but NOT PROJECT_DELETE
        $project = Project::findOne(self::PROJ1_ID);
        $this->assertFalse(PermissionService::canDeleteProject($project, self::USER3_ID));
    }

    // ---------------------------------------------------------------------------
    // canViewIssue / canCreateIssue / canUpdateIssue / canDeleteIssue
    // ---------------------------------------------------------------------------

    public function testCanViewIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(PermissionService::canViewIssue($issue, self::USER2_ID));
    }

    public function testCannotViewIssueForNonMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(PermissionService::canViewIssue($issue, self::USER4_ID));
    }

    public function testCanCreateIssueForMember()
    {
        $this->assertTrue(PermissionService::canCreateIssue(self::PROJ1_ID, self::USER2_ID));
    }

    public function testCannotCreateIssueForNonMember()
    {
        $this->assertFalse(PermissionService::canCreateIssue(self::PROJ1_ID, self::USER4_ID));
    }

    public function testCanUpdateIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(PermissionService::canUpdateIssue($issue, self::USER2_ID));
    }

    public function testCannotUpdateIssueForNonMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(PermissionService::canUpdateIssue($issue, self::USER4_ID));
    }

    public function testCanDeleteIssueForAdmin()
    {
        // user3 is org-admin → has ISSUE_DELETE via buildProjectPermissionsForRole(admin)
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertTrue(PermissionService::canDeleteIssue($issue, self::USER3_ID));
    }

    public function testCannotDeleteIssueForMember()
    {
        $issue = Issue::findOne(self::ISSUE1_ID);
        $this->assertFalse(PermissionService::canDeleteIssue($issue, self::USER2_ID));
    }

    // ---------------------------------------------------------------------------
    // canViewComment / canCreateComment / canDeleteComment / canUpdateComment
    // ---------------------------------------------------------------------------

    public function testCanViewCommentForMember()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(PermissionService::canViewComment($comment, self::USER2_ID));
    }

    public function testCannotViewCommentForNonMember()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertFalse(PermissionService::canViewComment($comment, self::USER4_ID));
    }

    public function testCanCreateCommentForMember()
    {
        $this->assertTrue(PermissionService::canCreateComment(self::PROJ1_ID, self::USER2_ID));
    }

    public function testCannotCreateCommentForNonMember()
    {
        $this->assertFalse(PermissionService::canCreateComment(self::PROJ1_ID, self::USER4_ID));
    }

    public function testCanDeleteCommentViaDeleteAnyPermission()
    {
        // user3 is org-admin → has COMMENT_DELETE_ANY
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(PermissionService::canDeleteComment($comment, self::USER3_ID));
    }

    public function testCanDeleteCommentViaOwnership()
    {
        // user2 is a project member (no COMMENT_DELETE_ANY), but "owns" this comment
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(PermissionService::canDeleteComment($comment, self::USER2_ID));
    }

    public function testCannotDeleteCommentWithoutPermissionOrOwnership()
    {
        // COMMENT2_ID is created_by USER1_ID, so USER2 is neither the owner nor has COMMENT_DELETE_ANY
        $comment = Comment::findOne(self::COMMENT2_ID);
        $this->assertFalse(PermissionService::canDeleteComment($comment, self::USER2_ID));
    }

    public function testCanUpdateCommentViaUpdateAnyPermission()
    {
        // user3 is org-admin → has COMMENT_UPDATE_ANY
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(PermissionService::canUpdateComment($comment, self::USER3_ID));
    }

    public function testCanUpdateCommentViaOwnership()
    {
        // user2 is a project member (no COMMENT_UPDATE_ANY), but "owns" this comment
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(PermissionService::canUpdateComment($comment, self::USER2_ID));
    }

    public function testCannotUpdateCommentWithoutPermissionOrOwnership()
    {
        // COMMENT2_ID is created_by USER1_ID, so USER2 is neither the owner nor has COMMENT_UPDATE_ANY
        $comment = Comment::findOne(self::COMMENT2_ID);
        $this->assertFalse(PermissionService::canUpdateComment($comment, self::USER2_ID));
    }

    // ---------------------------------------------------------------------------
    // canDoInProject
    // ---------------------------------------------------------------------------

    public function testCanDoInProjectForMemberWithViewPermission()
    {
        $this->assertTrue(
            PermissionService::canDoInProject(self::PROJ1_ID, self::USER2_ID, Permissions::ISSUE_VIEW)
        );
    }

    public function testCannotDoInProjectForNonMember()
    {
        $this->assertFalse(
            PermissionService::canDoInProject(self::PROJ1_ID, self::USER4_ID, Permissions::ISSUE_VIEW)
        );
    }

    public function testCanDoInProjectForAdminWithElevatedPermission()
    {
        $this->assertTrue(
            PermissionService::canDoInProject(self::PROJ1_ID, self::USER3_ID, Permissions::WORKTIME_DELETE_ANY)
        );
    }

    public function testCannotDoInProjectForMemberWithElevatedPermission()
    {
        $this->assertFalse(
            PermissionService::canDoInProject(self::PROJ1_ID, self::USER2_ID, Permissions::WORKTIME_DELETE_ANY)
        );
    }
}
