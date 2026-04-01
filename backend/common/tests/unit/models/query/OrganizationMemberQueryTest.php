<?php

namespace common\tests\unit\models\query;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\OrganizationMember;

class OrganizationMemberQueryTest extends Unit
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
            'organization_member' => [
                'class'    => OrganizationMemberFixture::class,
                'dataFile' => codecept_data_dir() . 'organization_member.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingMember(): void
    {
        $result = OrganizationMember::find()
            ->byId('01900000-0000-0007-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->user_id)->equals('01900000-0000-0000-0000-000000000001');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = OrganizationMember::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byUserId
    // -------------------------------------------------------------------------

    public function testByUserIdReturnsAllMembershipsForUser(): void
    {
        // user3 (admin.user) is a member of org1 (ADMIN) and org2 (OWNER)
        $results = OrganizationMember::find()
            ->byUserId('01900000-0000-0000-0000-000000000003')
            ->all();

        verify(count($results))->equals(2);
    }

    public function testByUserIdReturnsSingleMembershipForUser(): void
    {
        // user2 (jane.doe) is only a member of org1
        $results = OrganizationMember::find()
            ->byUserId('01900000-0000-0000-0000-000000000002')
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->role)->equals(RoleManager::ROLE_MEMBER);
    }

    public function testByUserIdReturnsEmptyForUnknownUser(): void
    {
        $results = OrganizationMember::find()
            ->byUserId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byUsername
    // -------------------------------------------------------------------------

    public function testByUsernameReturnsMatchingMember(): void
    {
        $result = OrganizationMember::find()
            ->byUsername('bayer.hudson')
            ->one();

        verify($result)->notNull();
        verify($result->user_id)->equals('01900000-0000-0000-0000-000000000001');
    }

    public function testByUsernameReturnsAllMembershipsForUser(): void
    {
        // admin.user belongs to 2 organizations
        $results = OrganizationMember::find()
            ->byUsername('admin.user')
            ->all();

        verify(count($results))->equals(2);
    }

    public function testByUsernameReturnsNullForUnknownUsername(): void
    {
        $result = OrganizationMember::find()
            ->byUsername('nonexistent.user')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byOrganization
    // -------------------------------------------------------------------------

    public function testByOrganizationReturnsAllMembersInOrg(): void
    {
        // org1 has 3 members: user1 (OWNER), user2 (MEMBER), user3 (ADMIN)
        $results = OrganizationMember::find()
            ->byOrganization('01900000-0000-0001-0000-000000000001')
            ->all();

        verify(count($results))->equals(3);
    }

    public function testByOrganizationReturnsSingleMemberForSecondOrg(): void
    {
        // org2 has 1 member: user3 (OWNER)
        $results = OrganizationMember::find()
            ->byOrganization('01900000-0000-0001-0000-000000000002')
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->user_id)->equals('01900000-0000-0000-0000-000000000003');
    }

    public function testByOrganizationReturnsEmptyForUnknownOrg(): void
    {
        $results = OrganizationMember::find()
            ->byOrganization('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byCursor
    // -------------------------------------------------------------------------

    public function testByCursorReturnsRecordsAfterCursor(): void
    {
        // Cursor at record 2 should return records 3 and 4
        $results = OrganizationMember::find()
            ->byCursor('01900000-0000-0007-0000-000000000002')
            ->all();

        verify(count($results))->equals(2);
        foreach ($results as $result) {
            verify($result->id > '01900000-0000-0007-0000-000000000002')->true();
        }
    }

    public function testByCursorReturnsAllRecordsForMinimalCursor(): void
    {
        $results = OrganizationMember::find()
            ->byCursor('00000000-0000-0000-0000-000000000000')
            ->all();

        verify(count($results))->equals(4);
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByOrganizationAndByUserId(): void
    {
        $result = OrganizationMember::find()
            ->byOrganization('01900000-0000-0001-0000-000000000001')
            ->byUserId('01900000-0000-0000-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->role)->equals(RoleManager::ROLE_OWNER);
    }

    public function testChainingByOrganizationAndByUsername(): void
    {
        $result = OrganizationMember::find()
            ->byOrganization('01900000-0000-0001-0000-000000000001')
            ->byUsername('jane.doe')
            ->one();

        verify($result)->notNull();
        verify($result->role)->equals(RoleManager::ROLE_MEMBER);
    }
}
