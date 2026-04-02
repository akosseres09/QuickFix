<?php

namespace common\tests\unit\models;

use api\components\permissions\RoleManager;
use Codeception\Test\Unit;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\ProjectMember;
use common\models\User;
use common\tests\UnitTester;
use Yii;
use yii\db\ActiveRecord;

class ProjectMemberTest extends Unit
{
    protected UnitTester $tester;

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
            'project' => [
                'class' => ProjectFixture::class,
            ],
            'project_member' => [
                'class' => ProjectMemberFixture::class,
            ],
            'label' => [
                'class' => LabelFixture::class,
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

    public function testRequiredFieldsAreEnforced(): void
    {
        $member = new ProjectMember();

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('project_id');
        verify($member->errors)->arrayHasKey('user_id');
        verify($member->getErrors('project_id'))->arrayContains('Project ID cannot be blank.');
        verify($member->getErrors('user_id'))->arrayContains('User ID cannot be blank.');
    }

    public function testRoleMustBeInList(): void
    {
        $member = new ProjectMember([
            'project_id' => '01900000-0000-7002-8000-000000000001',
            'user_id'    => '01900000-0000-7000-8000-000000000001',
            'role'       => 'emperor',
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('role');
        verify($member->getErrors('role'))->arrayContains('Role is invalid.');
    }

    public function testDefaultRoleIsMember(): void
    {
        $member = new ProjectMember();
        $member->validate();

        verify($member->role)->equals(RoleManager::ROLE_MEMBER);
    }

    public function testDuplicateUserInProjectFails(): void
    {
        $member = new ProjectMember([
            'project_id' => '01900000-0000-7002-8000-000000000001',
            'user_id'    => '01900000-0000-7000-8000-000000000001', // already owner
        ]);

        verify($member->validate())->false();
        // unique targetAttribute produces error on project_id
        verify($member->errors)->arrayHasKey('project_id');
        verify($member->getErrors('project_id'))->arrayContains('This user is already a member of this project.');
    }

    public function testProjectIdMustExist(): void
    {
        $member = new ProjectMember([
            'project_id' => '00000000-0000-0000-0000-000000000099',
            'user_id'    => '01900000-0000-7000-8000-000000000001',
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('project_id');
        verify($member->getErrors('project_id'))->arrayContains('Project ID is invalid.');
    }

    public function testUserIdMustExist(): void
    {
        $member = new ProjectMember([
            'project_id' => '01900000-0000-7002-8000-000000000001',
            'user_id'    => '00000000-0000-0000-0000-000000000099',
        ]);

        verify($member->validate())->false();
        verify($member->errors)->arrayHasKey('user_id');
        verify($member->getErrors('user_id'))->arrayContains('User ID is invalid.');
    }

    public function testValidRolesAccepted(): void
    {
        foreach (RoleManager::ROLE_LIST as $role) {
            $member = new ProjectMember([
                'project_id' => '01900000-0000-7002-8000-000000000001',
                'user_id'    => '01900000-0000-7000-8000-000000000003',
                'role'       => $role,
            ]);

            verify($member->validate(['role']))->true();
        }
    }

    public function testValidDataPassesValidation(): void
    {
        // admin.user is not a member of TEST project yet
        $member = new ProjectMember([
            'project_id' => '01900000-0000-7002-8000-000000000001',
            'user_id'    => '01900000-0000-7000-8000-000000000003',
            'role'       => RoleManager::ROLE_ADMIN,
        ]);

        verify($member->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeValidate
    // -------------------------------------------------------------------------

    public function testBeforeValidateFailsWhenParentBeforeValidateFails(): void
    {
        $member = new ProjectMember([
            'project_id' => '00000000-0000-0000-0000-000000000099', // non-existent project
            'user_id'    => '01900000-0000-7000-8000-000000000003',
            'role'       => RoleManager::ROLE_ADMIN,
        ]);

        $member->on(ActiveRecord::EVENT_BEFORE_VALIDATE, function ($event) {
            $event->isValid = false;
        });

        verify($member->validate())->false();
    }

    public function testBeforeValidateReturnsEarlyWhenMemberExists(): void
    {
        unset($_GET['project_id']);

        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($member->validate())->true();
    }


    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $this->loginFixtureUser();

        $member = new ProjectMember([
            'project_id' => '01900000-0000-7002-8000-000000000001',
            'user_id'    => '01900000-0000-7000-8000-000000000003',
            'role'       => RoleManager::ROLE_ADMIN,
        ]);

        $saved = $member->save();
        verify($saved)->true();
        verify($member->id)->notEmpty();
        verify($member->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureMembers(): void
    {
        $owner = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($owner)->notNull();
        verify($owner->role)->equals(RoleManager::ROLE_OWNER);
        verify($owner->project_id)->equals('01900000-0000-7002-8000-000000000001');

        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000002');
        verify($member)->notNull();
        verify($member->role)->equals(RoleManager::ROLE_MEMBER);
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    public function testIsAdmin(): void
    {
        $member = new ProjectMember(['role' => RoleManager::ROLE_ADMIN]);
        verify($member->isAdmin())->true();

        $member->role = RoleManager::ROLE_MEMBER;
        verify($member->isAdmin())->false();
    }

    public function testIsMember(): void
    {
        $member = new ProjectMember(['role' => RoleManager::ROLE_MEMBER]);
        verify($member->isMember())->true();

        $member->role = RoleManager::ROLE_ADMIN;
        verify($member->isMember())->false();
    }

    public function testGetRoles(): void
    {
        $roles = ProjectMember::getRoles();

        verify($roles)->arrayHasKey(RoleManager::ROLE_GUEST);
        verify($roles)->arrayHasKey(RoleManager::ROLE_MEMBER);
        verify($roles)->arrayHasKey(RoleManager::ROLE_ADMIN);
        verify($roles)->arrayHasKey(RoleManager::ROLE_OWNER);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetProject(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($member->project)->notNull();
        verify($member->project->key)->equals('TEST');
    }

    public function testGetUser(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($member->user)->notNull();
        verify($member->user->username)->equals('bayer.hudson');
    }

    public function testGetCreator(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($member->creator)->notNull();
    }

    public function testGetUpdator(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        verify($member->updator)->null(); // No updated_by in fixture
    }

    // -------------------------------------------------------------------------
    // attributeLabels / fields / extraFields
    // -------------------------------------------------------------------------

    public function testAttributeLabels(): void
    {
        $member = new ProjectMember();
        $labels = $member->attributeLabels();
        verify($labels['id'])->equals('ID');
        verify($labels['project_id'])->equals('Project ID');
        verify($labels['user_id'])->equals('User ID');
        verify($labels['role'])->equals('Role');
    }

    public function testFields(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        $fields = $member->fields();
        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('role');
        verify($fields)->arrayHasKey('projectId');
        verify($fields)->arrayContains('project_id');
        verify($fields)->arrayHasKey('userId');
        verify($fields)->arrayContains('user_id');
    }

    public function testExtraFields(): void
    {
        $member = ProjectMember::findOne('01900000-0000-7008-8000-000000000001');
        $extra = $member->extraFields();
        verify($extra)->arrayContains('project');
        verify($extra)->arrayContains('user');
        verify($extra)->arrayContains('updator');
        verify($extra)->arrayContains('creator');
    }
}
