<?php

namespace common\tests\unit\models;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationInvitationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\OrganizationInvitation;
use common\models\OrganizationMember;
use common\models\User;
use common\tests\UnitTester;
use ReflectionClass;
use Yii;
use yii\base\Event;
use yii\db\ActiveRecord;

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
    protected UnitTester $tester;
    protected User | null $user;

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

    protected function _before()
    {
        $this->user = $this->loginFixtureUser();
        return parent::_before();
    }

    protected function _after()
    {
        $this->user = null;
        return parent::_after();
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

    public function testEmailNotNewRecord(): void
    {
        $orginv = $this->tester->grabFixture('organization_invitation', 0);
        $invitation = new OrganizationInvitation([
            'email'           => $orginv['email'],
            'role'            => $orginv['role'],
            'organization_id' => $orginv['organization_id'],
            'status'          => $orginv['status'],
            'inviter_id'      => $orginv['inviter_id'],
        ]);

        $invitation->setIsNewRecord(false); // Simulate loading an existing record with an email

        verify($invitation->validate('email'))->true();
        verify($invitation->hasErrors('email'))->false();
    }

    public function testSelfInvite(): void
    {
        $org = $this->tester->grabFixture('organization', 0);
        $invitation = new OrganizationInvitation([
            'email'           => $this->user->email,
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('email'))->true();
        verify($invitation->getErrors('email'))->arrayContains('You cannot invite yourself to an organization.');
    }

    public function testInvalidRole(): void
    {
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
        // 'invited@example.com' already has a pending invitation in the fixture
        $invitation = new OrganizationInvitation([
            'email'           => 'invited@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-7001-8000-000000000001',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('organization_id'))->true();
        verify($invitation->getErrors('organization_id'))->arrayContains('An invitation for this email and organization already exists.');
    }

    public function testDuplicateAcceptedInvitation(): void
    {
        // 'accepted@example.com' already has an accepted invitation in the fixture
        $invitation = new OrganizationInvitation([
            'email'           => 'accepted@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-7001-8000-000000000001',
        ]);

        verify($invitation->validate())->false();
        verify($invitation->hasErrors('organization_id'))->true();
        verify($invitation->getErrors('organization_id'))->arrayContains('An invitation for this email and organization already exists.');
    }

    public function testRevokedInvitationDoesNotBlockNewInvitation(): void
    {
        // 'revoked@example.com' has a revoked invitation — uniqueness check excludes revoked
        $invitation = new OrganizationInvitation([
            'email'           => 'revoked@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => '01900000-0000-7001-8000-000000000001',
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
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('invited@example.com');
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_PENDING);
        verify($invitation->role)->equals(RoleManager::ROLE_MEMBER);
        verify($invitation->organization_id)->equals('01900000-0000-7001-8000-000000000001');
    }

    public function testFindAcceptedInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000002'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('accepted@example.com');
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_ACCEPTED);
    }

    public function testFindExpiredInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000003'])
            ->one();

        verify($invitation)->notNull();
        verify($invitation->email)->equals('expired@example.com');
        verify($invitation->role)->equals(RoleManager::ROLE_GUEST);
        verify($invitation->status)->equals(OrganizationInvitation::STATUS_PENDING);
    }

    public function testFindRevokedInvitation(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000004'])
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
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();
        verify($pending->isPending())->true();

        $accepted = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000002'])
            ->one();
        verify($accepted->isPending())->false();

        $revoked = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000004'])
            ->one();
        verify($revoked->isPending())->false();
    }

    public function testIsExpired(): void
    {
        // Far-future expiry — not expired
        $pending = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();
        verify($pending->isExpired())->false();

        // Already-expired timestamp
        $expired = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000003'])
            ->one();
        verify($expired->isExpired())->true();
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetInviter(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();

        verify($invitation->inviter)->notNull();
        verify($invitation->inviter->username)->equals('bayer.hudson');
    }

    public function testGetOrganization(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
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

    // -------------------------------------------------------------------------
    // fields / extraFields / transactions
    // -------------------------------------------------------------------------

    public function testFields(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();

        $fields = $invitation->fields();

        verify($fields)->arrayContains('id');
        verify($fields)->arrayHasKey('organizationId');
        verify($fields)->arrayContains('organization_id');

        verify($fields)->arrayHasKey('inviterId');
        verify($fields)->arrayContains('inviter_id');

        verify($fields)->arrayContains('email');
        verify($fields)->arrayContains('role');
        verify($fields)->arrayContains('status');

        verify($fields)->arrayContains('token');
        verify($fields)->arrayHasKey('expiresAt');
        verify($fields)->arrayContains('expires_at');

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');
    }

    public function testExtraFields(): void
    {
        $invitation = OrganizationInvitation::find()
            ->where(['id' => '01900000-0000-7009-8000-000000000001'])
            ->one();

        $extra = $invitation->extraFields();

        verify($extra)->arrayContains('inviter');
        verify($extra)->arrayContains('organization');
    }

    public function testTransactions(): void
    {
        $invitation = new OrganizationInvitation();
        $transactions = $invitation->transactions();

        verify($transactions)->arrayHasKey(\yii\db\ActiveRecord::SCENARIO_DEFAULT);
    }

    // -------------------------------------------------------------------------
    // beforeSave — sets id and expires_at on insert
    // -------------------------------------------------------------------------

    public function testSaveSetUuidAndExpiresAt(): void
    {
        $org = $this->tester->grabFixture('organization', 0);

        $timeBefore = time();
        $invitation = new OrganizationInvitation([
            'email'           => 'newmember@example.com',
            'role'            => RoleManager::ROLE_MEMBER,
            'organization_id' => $org['id'],
        ]);

        verify($invitation->save())->true();
        verify($invitation->id)->notEmpty();
        verify($invitation->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
        verify($invitation->expires_at)->greaterThanOrEqual($timeBefore + OrganizationInvitation::EXPIRATION_LENGTH - 2);
    }


    public function testParentSaveBeforeIsFalseInSaveBefore(): void
    {
        $invitation = new OrganizationInvitation([
            'email' => 'fail@example.com',
            'organization_id' => '01900000-0000-7001-8000-000000000001',
            'role' => RoleManager::ROLE_MEMBER,
        ]);

        // Intercept the event and force it to fail right before your method gets called
        $invitation->on(ActiveRecord::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false;
        });

        // The save should return false entirely because parent::beforeSave failed
        verify($invitation->save())->false();

        // Assert that because it failed early, it never reached the Uuid generation code
        verify($invitation->id)->null();
        verify($invitation->expires_at)->null();
    }

    public function testNotInsertForBeforeSave(): void
    {
        $invitation = OrganizationInvitation::findOne('01900000-0000-7009-8000-000000000005');
        verify($invitation)->notNull();

        $originalId = $invitation->id;
        $originalExpiresAt = $invitation->expires_at;

        $invitation->status = OrganizationInvitation::STATUS_ACCEPTED;

        // Ensure the update was successful
        verify($invitation->save())->true();

        verify($invitation->id)->equals($originalId);
        verify($invitation->expires_at)->equals($originalExpiresAt);
    }

    public function testUserNotFoundInAfterSave(): void
    {
        $orgInv = OrganizationInvitation::findOne(['id' => '01900000-0000-7009-8000-000000000001']);

        $orgInv->status = OrganizationInvitation::STATUS_ACCEPTED;

        $this->expectException(\yii\web\ServerErrorHttpException::class);
        $this->expectExceptionMessage('Cannot accept invitation: User does not exist.');

        $orgInv->save();
    }

    public function testCreateOrganizationMemberCalledOnAccept(): void
    {

        $orgInv = OrganizationInvitation::findOne(['id' => '01900000-0000-7009-8000-000000000005']);
        $originalStatus = $orgInv->status;
        $orgInv->status = OrganizationInvitation::STATUS_ACCEPTED;

        // We expect this to succeed without exception, which means createOrganizationMember was called and found the user
        verify($orgInv->save())->true();

        $updatedInv = OrganizationInvitation::findOne(['id' => '01900000-0000-7009-8000-000000000005']);
        verify($updatedInv->status)->notEquals($originalStatus); // Status should have been updated to accepted);
        verify($updatedInv->status)->equals(OrganizationInvitation::STATUS_ACCEPTED);

        $userId = User::find()->select('id')->where(['email' => $updatedInv->email])->scalar();
        $orgMember = OrganizationMember::findOne([
            'organization_id' => $updatedInv->organization_id,
            'user_id' => $userId,
            'role' => $updatedInv->role,
        ]);

        verify($orgMember)->notNull();
    }

    public function testCreateOrganizationMemberTransactionFailsWhenOwnerCanNotBeSaved(): void
    {
        $orgInv = OrganizationInvitation::findOne(['id' => '01900000-0000-7009-8000-000000000005']);

        $orgInv->status = OrganizationInvitation::STATUS_ACCEPTED;

        // Intercept the event and force it to fail right before the organization member save
        Event::on(OrganizationMember::class, ActiveRecord::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false;
        });

        // We expect this to throw an exception due to the failed transaction
        $this->expectException(\yii\db\Exception::class);
        $this->expectExceptionMessageMatches('/Transaction aborted: Could not save Organization Member. /');

        $orgInv->save();
    }

    public function testSendInvitationEmailCalledWithNoOrganizationInvitation(): void
    {
        $invitation = new OrganizationInvitation();
        $invitation->id = '00000000-0000-0000-0000-000000000000'; // non-existent

        $method = (new ReflectionClass($invitation))->getMethod('sendInvitationEmail');

        $method->invoke($invitation);
        verify($invitation->id)->equals('00000000-0000-0000-0000-000000000000');
    }
}
