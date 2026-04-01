<?php

namespace common\tests\unit\models;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationInvitationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\OrganizationInvitation;
use common\models\User;
use Yii;

/**
 * Tests for OrganizationInvitation model.
 *
 * NOTE: OrganizationInvitation::init() calls Yii::$app->get('jwt'), so we
 * cannot instantiate the model directly without the JWT component configured.
 * These tests focus on fixture-loaded data queried via raw ActiveRecord and
 * on validation behavior that does not require init().
 */
class OrganizationInvitationTest extends Unit
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
                'class' => OrganizationFixture::class,
            ],
            'organization_member' => [
                'class' => OrganizationMemberFixture::class,
            ],
            'organization_invitation' => [
                'class' => OrganizationInvitationFixture::class,
            ],
        ];
    }

    private function loginFixtureUser(): User
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        Yii::$app->user->setIdentity($user);
        return $user;
    }
    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFields(): void
    {
        $invitation = new OrganizationInvitation();

        verify($invitation->validate())->false();
        verify($invitation->errors)->arrayHasKey('email');
        verify($invitation->getErrors('email'))->arrayContains('Email cannot be blank.');
        verify($invitation->errors)->arrayHasKey('role');
        verify($invitation->getErrors('role'))->arrayContains('Role cannot be blank.');
        verify($invitation->errors)->arrayHasKey('organization_id');
        verify($invitation->getErrors('organization_id'))->arrayContains('Organization Id cannot be blank.');
    }

    public function testExistingOrganization(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'test@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->true();
        verify($invitation->hasErrors('organization_id'))->false();
    }

    public function testNonExistingOrganization(): void
    {
        $this->loginFixtureUser();
        $invitation = new OrganizationInvitation([
            'email'           => 'nonexistent@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => 'nonexistent-id',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('organization_id'))->true();
        verify($invitation->getErrors('organization_id'))->arrayContains('Organization Id is invalid.');
    }

    public function testValidInviterId(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'asd@asd.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->true();
        verify($invitation->hasErrors('inviter_id'))->false();
    }

    public function testInvalidInviterId(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'test@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
            'inviter_id'      => 'nonexistent-user-id',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('inviter_id'))->true();
        verify($invitation->getErrors('inviter_id'))->arrayContains('Inviter Id is invalid.');
    }

    public function testInvalidEmailFormat(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'not-a-valid-email',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('email'))->true();
        verify($invitation->getErrors('email'))->arrayContains('Email is not a valid email address.');
    }

    public function testSelfInvite(): void
    {
        $user = $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => $user->email,
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('email'))->true();
        verify($invitation->getErrors('email'))->arrayContains('You cannot invite yourself to an organization.');
    }

    public function testInvalidRole(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'test@example.com',
            'role'            => 'superuser',
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('role'))->true();
        verify($invitation->getErrors('role'))->arrayContains('Role is invalid.');
    }


    public function testStatusDefaultsToPending(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'test@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        $invitation->validate();
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_PENDING);
    }

    public function testInvalidStatus(): void
    {
        $this->loginFixtureUser();
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => 'test@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
            'status'          => 'unknown',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('status'))->true();
        verify($invitation->getErrors('status'))->arrayContains('Status is invalid.');
    }

    public function testDuplicatePendingInvitation(): void
    {
        $this->loginFixtureUser();
        // 'invited@example.com' already has a pending invitation in the fixture
        $invitation = new OrganizationInvitation([
            'email'           => 'invited@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-0001-0000-000000000001',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('organization_id'))->true();
        verify($invitation->getErrors('organization_id'))->arrayContains('An invitation for this email and organization already exists.');
    }

    public function testDuplicateAcceptedInvitation(): void
    {
        $this->loginFixtureUser();
        // 'accepted@example.com' already has an accepted invitation in the fixture
        $invitation = new OrganizationInvitation([
            'email'           => 'accepted@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-0001-0000-000000000001',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('organization_id'))->true();
        verify($invitation->getErrors('organization_id'))->arrayContains('An invitation for this email and organization already exists.');
    }

    public function testRevokedInvitationDoesNotBlockNewInvitation(): void
    {
        $this->loginFixtureUser();
        // 'revoked@example.com' has a revoked invitation — uniqueness check excludes revoked
        $invitation = new OrganizationInvitation([
            'email'           => 'revoked@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-0001-0000-000000000001',
        ]);

        verify($invitation->validate())->true();
        verify($invitation->hasErrors('email'))->false();
    }


    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindPendingInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000001'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('invited@example.com');
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_PENDING);
        verify($invitation->role)->equals(RoleManager::ROLE_MEMBER);
        verify($invitation->organization_id)->equals('01900000-0000-0001-0000-000000000001');
    }

    public function testFindAcceptedInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000002'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('accepted@example.com');
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_ACCEPTED);
    }

    public function testFindExpiredInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000003'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('expired@example.com');
        verify($invitation->role)->equals(RoleManager::ROLE_GUEST);
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_PENDING);
    }

    public function testFindRevokedInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000004'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_REVOKED);
    }

    // -------------------------------------------------------------------------
    // isPending / isExpired
    // -------------------------------------------------------------------------

    public function testIsPending(): void
    {
        $pending = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000001'])
            ->one();
        verify($pending->isPending())->true();

        $accepted = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000002'])
            ->one();
        verify($accepted->isPending())->false();

        $revoked = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000004'])
            ->one();
        verify($revoked->isPending())->false();
    }

    public function testIsExpired(): void
    {
        // Far-future expiry — not expired
        $pending = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000001'])
            ->one();
        verify($pending->isExpired())->false();

        // Already-expired timestamp
        $expired = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000003'])
            ->one();
        verify($expired->isExpired())->true();
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetInviter(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000001'])
            ->one();

        verify($invitation->inviter)->notNull();
        verify($invitation->inviter->username)->equals('bayer.hudson');
    }

    public function testGetOrganization(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-0009-0000-000000000001'])
            ->one();

        verify($invitation->organization)->notNull();
        verify($invitation->organization->slug)->equals('test-org');
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testStatusConstants(): void
    {
        verify(OrganizationInvitation::STATUS_PENDING)->equals('pending');
        verify(OrganizationInvitation::STATUS_ACCEPTED)->equals('accepted');
        verify(OrganizationInvitation::STATUS_REJECTED)->equals('rejected');
        verify(OrganizationInvitation::STATUS_REVOKED)->equals('revoked');
    }

    public function testExpirationLength(): void
    {
        // 7 days in seconds
        verify(OrganizationInvitation::EXPIRATION_LENGTH)->equals(7 * 24 * 60 * 60);
    }

    public function testStatusesList(): void
    {
        verify(OrganizationInvitation::STATUSES)->arrayContains(OrganizationInvitation::STATUS_PENDING);
        verify(OrganizationInvitation::STATUSES)->arrayContains(OrganizationInvitation::STATUS_ACCEPTED);
        verify(OrganizationInvitation::STATUSES)->arrayContains(OrganizationInvitation::STATUS_REJECTED);
        verify(OrganizationInvitation::STATUSES)->arrayContains(OrganizationInvitation::STATUS_REVOKED);
    }
}
