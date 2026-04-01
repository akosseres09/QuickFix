<?php

namespace common\tests\unit\models\query;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationInvitationFixture;
use common\fixtures\UserFixture;
use common\models\OrganizationInvitation;

class OrganizationInvitationQueryTest extends Unit
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
            'organization_invitation' => [
                'class'    => OrganizationInvitationFixture::class,
                'dataFile' => codecept_data_dir() . 'organization_invitation.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingRecord(): void
    {
        $result = OrganizationInvitation::find()
            ->byId('01900000-0000-0009-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->email)->equals('invited@example.com');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = OrganizationInvitation::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byOrganization
    // -------------------------------------------------------------------------

    public function testByOrganizationReturnsAllInvitationsForOrg(): void
    {
        $results = OrganizationInvitation::find()
            ->byOrganization('01900000-0000-0001-0000-000000000001')
            ->all();

        // All 4 fixture invitations belong to this org
        verify(count($results))->equals(4);
    }

    public function testByOrganizationReturnsEmptyForUnknownOrg(): void
    {
        $results = OrganizationInvitation::find()
            ->byOrganization('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byEmail
    // -------------------------------------------------------------------------

    public function testByEmailReturnsMatchingRecord(): void
    {
        $result = OrganizationInvitation::find()
            ->byEmail('accepted@example.com')
            ->one();

        verify($result)->notNull();
        verify($result->status)->equals(OrganizationInvitation::STATUS_ACCEPTED);
    }

    public function testByEmailReturnsNullForUnknownEmail(): void
    {
        $result = OrganizationInvitation::find()
            ->byEmail('nobody@example.com')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // pending
    // -------------------------------------------------------------------------

    public function testPendingReturnsOnlyPendingRecords(): void
    {
        $results = OrganizationInvitation::find()
            ->pending()
            ->all();

        // Fixture has 2 pending: invited@example.com and expired@example.com
        verify(count($results))->equals(2);
        foreach ($results as $result) {
            verify($result->status)->equals(OrganizationInvitation::STATUS_PENDING);
        }
    }

    // -------------------------------------------------------------------------
    // accepted
    // -------------------------------------------------------------------------

    public function testAcceptedReturnsOnlyAcceptedRecords(): void
    {
        $results = OrganizationInvitation::find()
            ->accepted()
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->email)->equals('accepted@example.com');
    }

    // -------------------------------------------------------------------------
    // revoked
    // -------------------------------------------------------------------------

    public function testRevokedReturnsOnlyRevokedRecords(): void
    {
        $results = OrganizationInvitation::find()
            ->revoked()
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->email)->equals('revoked@example.com');
    }

    // -------------------------------------------------------------------------
    // rejected
    // -------------------------------------------------------------------------

    public function testRejectedReturnsEmptyWhenNoneExist(): void
    {
        $results = OrganizationInvitation::find()
            ->rejected()
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByOrganizationAndPending(): void
    {
        $results = OrganizationInvitation::find()
            ->byOrganization('01900000-0000-0001-0000-000000000001')
            ->pending()
            ->all();

        verify(count($results))->equals(2);
    }

    public function testChainingByEmailAndPending(): void
    {
        $result = OrganizationInvitation::find()
            ->byEmail('invited@example.com')
            ->pending()
            ->one();

        verify($result)->notNull();
        verify($result->role)->equals(RoleManager::ROLE_MEMBER);
    }
}
