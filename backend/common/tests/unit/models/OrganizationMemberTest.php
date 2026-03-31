<?php

namespace common\tests\unit\models;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\OrganizationMember;
use common\models\User;
use Yii;

class OrganizationMemberTest extends Unit
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
                'dataFile' => codecept_data_dir() . 'organization.php',
            ],
            'organization_member' => [
                'class' => OrganizationMemberFixture::class,
                'dataFile' => codecept_data_dir() . 'organization_member.php',
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

    public function testUserIdIsRequired(): void
    {
        $member = new OrganizationMember();
        $member->organization_id = '01900000-0000-0001-0000-000000000001';

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('user_id');
        verify($member->getErrors('user_id'))->arrayContains('User Id cannot be blank.');
    }

    public function testRoleMustBeInList(): void
    {
        $member = new OrganizationMember([
            'organization_id' => '01900000-0000-0001-0000-000000000001',
            'user_id'         => '01900000-0000-0000-0000-000000000001',
            'role'            => 'superadmin', // not in RoleManager::ROLE_LIST
        ]);


        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('role');
        verify($member->getErrors('role'))->arrayContains('Role is invalid.');
    }

    public function testDefaultRoleIsMember(): void
    {
        $_GET['organization_id'] = '01900000-0000-0001-0000-000000000001';
        $member = new OrganizationMember();
        $member->validate();

        verify($member->role)->equals(RoleManager::ROLE_MEMBER);

        unset($_GET['organization_id']);
    }

    public function testDuplicateUserInOrgFails(): void
    {
        $member = new OrganizationMember([
            'organization_id' => '01900000-0000-0001-0000-000000000001',
            'user_id'         => '01900000-0000-0000-0000-000000000001', // already owner
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('user_id');
        verify($member->getErrors('user_id'))->arrayContains('This user is already a member of this organization.');
    }

    public function testOrganizationIdMustExist(): void
    {
        $member = new OrganizationMember([
            'organization_id' => '00000000-0000-0000-0000-000000000099',
            'user_id'         => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('organization_id');
        verify($member->getErrors('organization_id'))->arrayContains('Organization Id is invalid.');
    }

    public function testUserIdMustExist(): void
    {
        $member = new OrganizationMember([
            'organization_id' => '01900000-0000-0001-0000-000000000001',
            'user_id'         => '00000000-0000-0000-0000-000000000099',
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('user_id');
        verify($member->getErrors('user_id'))->arrayContains('User Id is invalid.');
    }

    public function testValidRolesAccepted(): void
    {
        foreach (RoleManager::ROLE_LIST as $role) {
            $member = new OrganizationMember([
                'organization_id' => '01900000-0000-0001-0000-000000000002',
                'user_id'         => '01900000-0000-0000-0000-000000000001',
                'role'            => $role,
            ]);

            verify($member->validate(['role']))->true();
        }
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $this->loginFixtureUser();

        $_GET['organization_id'] = '01900000-0000-0001-0000-000000000002';

        $member = new OrganizationMember([
            'user_id' => '01900000-0000-0000-0000-000000000001',
            'role'    => RoleManager::ROLE_MEMBER,
        ]);

        $saved = $member->save();
        verify($saved)->true();
        verify($member->id)->notEmpty();
        verify($member->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );

        unset($_GET['organization_id']);
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureMembers(): void
    {
        $owner = OrganizationMember::findOne('01900000-0000-0007-0000-000000000001');
        verify($owner)->notNull();
        verify($owner->role)->equals(RoleManager::ROLE_OWNER);
        verify($owner->user_id)->equals('01900000-0000-0000-0000-000000000001');

        $member = OrganizationMember::findOne('01900000-0000-0007-0000-000000000002');
        verify($member)->notNull();
        verify($member->role)->equals(RoleManager::ROLE_MEMBER);

        $admin = OrganizationMember::findOne('01900000-0000-0007-0000-000000000004');
        verify($admin)->notNull();
        verify($admin->role)->equals(RoleManager::ROLE_ADMIN);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetUser(): void
    {
        $member = OrganizationMember::findOne('01900000-0000-0007-0000-000000000001');
        verify($member->user)->notNull();
        verify($member->user->username)->equals('bayer.hudson');
    }

    public function testGetOrganization(): void
    {
        $member = OrganizationMember::findOne('01900000-0000-0007-0000-000000000001');
        verify($member->organization)->notNull();
        verify($member->organization->slug)->equals('test-org');
    }

    public function testGetCreator(): void
    {
        $member = OrganizationMember::findOne('01900000-0000-0007-0000-000000000001');
        verify($member->creator)->notNull();
        verify($member->creator->username)->equals('bayer.hudson');
    }

    public function testGetUpdator(): void
    {
        $member = OrganizationMember::findOne('01900000-0000-0007-0000-000000000001');
        verify($member->updator)->null(); // No updated_by in fixture
    }
}
