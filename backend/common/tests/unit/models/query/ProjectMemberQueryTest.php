<?php

namespace common\tests\unit\models\query;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\ProjectMember;

class ProjectMemberQueryTest extends Unit
{
    protected $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class'    => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
            'organization' => [
                'class'    => OrganizationFixture::class,
                'dataFile' => codecept_data_dir() . 'organization.php',
            ],
            'project' => [
                'class'    => ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
            ],
            'label' => [
                'class'    => LabelFixture::class,
                'dataFile' => codecept_data_dir() . 'label.php',
            ],
            'project_member' => [
                'class'    => ProjectMemberFixture::class,
                'dataFile' => codecept_data_dir() . 'project_member.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingMember(): void
    {
        $result = ProjectMember::find()
            ->byId('01900000-0000-0008-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->user_id)->equals('01900000-0000-0000-0000-000000000001');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = ProjectMember::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byProjectId
    // -------------------------------------------------------------------------

    public function testByProjectIdReturnsAllMembersInProject(): void
    {
        // Project TEST has 2 members: user1 (OWNER) and user2 (MEMBER)
        $results = ProjectMember::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->all();

        verify(count($results))->equals(2);
    }

    public function testByProjectIdReturnsEmptyForUnknownProject(): void
    {
        $results = ProjectMember::find()
            ->byProjectId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // notUser
    // -------------------------------------------------------------------------

    public function testNotUserExcludesGivenUser(): void
    {
        // In project TEST, user1 and user2 are members. Excluding user1 leaves 1.
        $results = ProjectMember::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->notUser('01900000-0000-0000-0000-000000000001')
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->user_id)->equals('01900000-0000-0000-0000-000000000002');
    }

    // -------------------------------------------------------------------------
    // byCursor
    // -------------------------------------------------------------------------

    public function testByCursorReturnsRecordsAfterCursor(): void
    {
        // Cursor at record 2 should return records 3, 4, 5
        $results = ProjectMember::find()
            ->byCursor('01900000-0000-0008-0000-000000000002')
            ->all();

        verify(count($results))->equals(3);
        foreach ($results as $result) {
            verify($result->id > '01900000-0000-0008-0000-000000000002')->true();
        }
    }

    public function testByCursorReturnsAllForMinimalCursor(): void
    {
        // Cursor before all records should return all 5
        $results = ProjectMember::find()
            ->byCursor('00000000-0000-0000-0000-000000000000')
            ->all();

        verify(count($results))->equals(5);
    }

    // -------------------------------------------------------------------------
    // byUser
    // -------------------------------------------------------------------------

    public function testByUserReturnsAllMembershipsForUser(): void
    {
        // User1 is a member of 3 projects (TEST, PRIV, TEAM)
        $results = ProjectMember::find()
            ->byUser('01900000-0000-0000-0000-000000000001')
            ->all();

        verify(count($results))->equals(3);
    }

    public function testByUserReturnsTwoMembershipsForSecondUser(): void
    {
        // User2 is a member of 2 projects (TEST, TEAM)
        $results = ProjectMember::find()
            ->byUser('01900000-0000-0000-0000-000000000002')
            ->all();

        verify(count($results))->equals(2);
    }

    // -------------------------------------------------------------------------
    // byRole
    // -------------------------------------------------------------------------

    public function testByRoleReturnsOwnerRecords(): void
    {
        $results = ProjectMember::find()
            ->byRole(RoleManager::ROLE_OWNER)
            ->all();

        // Records 1, 3, 4 are OWNER
        verify(count($results))->equals(3);
        foreach ($results as $result) {
            verify($result->role)->equals(RoleManager::ROLE_OWNER);
        }
    }

    public function testByRoleReturnsMemberRecords(): void
    {
        $results = ProjectMember::find()
            ->byRole(RoleManager::ROLE_MEMBER)
            ->all();

        // Records 2, 5 are MEMBER
        verify(count($results))->equals(2);
        foreach ($results as $result) {
            verify($result->role)->equals(RoleManager::ROLE_MEMBER);
        }
    }

    // -------------------------------------------------------------------------
    // admins / members
    // -------------------------------------------------------------------------

    public function testAdminsReturnsEmptyWhenNoAdminsExist(): void
    {
        // Fixture has no ADMIN project members
        $results = ProjectMember::find()->admins()->all();

        verify($results)->empty();
    }

    public function testMembersReturnsOnlyMemberRoleRecords(): void
    {
        $results = ProjectMember::find()->members()->all();

        verify(count($results))->equals(2);
        foreach ($results as $result) {
            verify($result->role)->equals(RoleManager::ROLE_MEMBER);
        }
    }

    // -------------------------------------------------------------------------
    // latest / oldest
    // -------------------------------------------------------------------------

    public function testLatestReturnsResultsOrderedByCreatedAtDesc(): void
    {
        $results = ProjectMember::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->latest()
            ->all();

        verify(count($results))->equals(2);
        verify($results[0]->created_at >= $results[1]->created_at)->true();
    }

    public function testOldestReturnsResultsOrderedByCreatedAtAsc(): void
    {
        $results = ProjectMember::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->oldest()
            ->all();

        verify(count($results))->equals(2);
        verify($results[0]->created_at <= $results[1]->created_at)->true();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByProjectIdAndByRole(): void
    {
        $results = ProjectMember::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->byRole(RoleManager::ROLE_OWNER)
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->user_id)->equals('01900000-0000-0000-0000-000000000001');
    }

    public function testChainingByUserAndByRole(): void
    {
        $results = ProjectMember::find()
            ->byUser('01900000-0000-0000-0000-000000000002')
            ->byRole(RoleManager::ROLE_MEMBER)
            ->all();

        verify(count($results))->equals(2);
    }
}
