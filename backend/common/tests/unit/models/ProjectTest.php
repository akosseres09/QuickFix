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
use common\models\Project;
use common\models\ProjectMember;
use common\models\User;
use Yii;

class ProjectTest extends Unit
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
            'project' => [
                'class' => ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
            ],
            'project_member' => [
                'class' => ProjectMemberFixture::class,
                'dataFile' => codecept_data_dir() . 'project_member.php',
            ],
            'label' => [
                'class' => LabelFixture::class,
                'dataFile' => codecept_data_dir() . 'label.php',
            ],
        ];
    }

    protected function _before()
    {
        $_GET['organization_id'] = '01900000-0000-0001-0000-000000000001';
        parent::_before();
    }

    protected function _after()
    {
        unset($_GET['organization_id']);
        parent::_after();
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
        $project = new Project();

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('name');
        verify($project->errors)->arrayHasKey('key');
        verify($project->errors)->arrayHasKey('owner_id');
    }

    public function testKeyMaxLengthEnforced(): void
    {
        $project = new Project([
            'name'            => 'Long Key Project',
            'key'             => 'TOOLONGKEYX', // max is 10
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('key');
    }

    public function testKeyPatternEnforced(): void
    {
        $project = new Project([
            'name'            => 'Bad Key Project',
            'key'             => 'lower',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('key');
    }

    public function testKeyPatternAcceptsValidKeys(): void
    {
        $project = new Project([
            'name'            => 'Valid Key',
            'key'             => 'ABC-123_X',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate(['key']))->true();
    }

    public function testKeyMustBeUnique(): void
    {
        $project = new Project([
            'name'            => 'Duplicate Key',
            'key'             => 'TEST', // already exists
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('key');
    }

    public function testStatusMustBeInList(): void
    {
        $project = new Project([
            'name'            => 'Bad Status',
            'key'             => 'BADST',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
            'status'          => 'invalid_status',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('status');
    }

    public function testVisibilityMustBeInList(): void
    {
        $project = new Project([
            'name'            => 'Bad Visibility',
            'key'             => 'BADVIS',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
            'visibility'      => 'secret',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('visibility');
    }

    public function testPriorityMustBeInList(): void
    {
        $project = new Project([
            'name'            => 'Bad Priority',
            'key'             => 'BADPRI',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
            'priority'        => 99,
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('priority');
    }

    public function testDefaultValues(): void
    {
        $project = new Project();
        $project->validate();

        verify($project->status)->equals(Project::STATUS_ACTIVE);
        verify($project->visibility)->equals(Project::VISIBILITY_PUBLIC);
        verify($project->priority)->equals(Project::PRIORITY_MEDIUM);
        verify($project->is_archived)->equals(false);
    }

    public function testOwnerIdMustExist(): void
    {
        $project = new Project([
            'name'            => 'FK Test',
            'key'             => 'FKTEST',
            'owner_id'        => '00000000-0000-0000-0000-000000000099', // nonexistent
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('owner_id');
    }

    public function testValidDataPassesValidation(): void
    {
        $project = new Project([
            'name'            => 'New Valid Project',
            'key'             => 'NEWPROJ',
            'owner_id'        => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate())->true();
    }

    // -------------------------------------------------------------------------
    // DB round-trip & hooks
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $this->loginFixtureUser();

        $project = new Project([
            'name' => 'UUID Project',
            'key'  => 'UUIDP',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        $saved = $project->save();
        verify($saved)->true();
        verify($project->id)->notEmpty();
        verify($project->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    public function testSaveCreatesOwnerMembership(): void
    {
        $user = $this->loginFixtureUser();

        $project = new Project([
            'name' => 'Membership Project',
            'key'  => 'MEMPRJ',
            'owner_id' => $user->id,
        ]);
        $project->save();

        $member = ProjectMember::findOne([
            'project_id' => $project->id,
            'user_id'    => $user->id,
        ]);

        verify($member)->notNull();
        verify($member->role)->equals(RoleManager::ROLE_OWNER);
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureProjects(): void
    {
        $publicProject = Project::findOne(['key' => 'TEST']);
        verify($publicProject)->notNull();
        verify($publicProject->name)->equals('Test Project');
        verify($publicProject->visibility)->equals(Project::VISIBILITY_PUBLIC);
        verify($publicProject->status)->equals(Project::STATUS_ACTIVE);

        $privateProject = Project::findOne(['key' => 'PRIV']);
        verify($privateProject)->notNull();
        verify($privateProject->visibility)->equals(Project::VISIBILITY_PRIVATE);
        verify($privateProject->status)->equals(Project::STATUS_ON_HOLD);

        $teamProject = Project::findOne(['key' => 'TEAM']);
        verify($teamProject)->notNull();
        verify($teamProject->visibility)->equals(Project::VISIBILITY_TEAM);
        verify($teamProject->is_archived)->true();
        verify($teamProject->archived_at)->notNull();
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    public function testCanAccessPublicProjectAsOrgMember(): void
    {
        $project = Project::findOne(['key' => 'TEST']);

        // bayer.hudson is owner, jane.doe is org member
        verify($project->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        verify($project->canAccess('01900000-0000-0000-0000-000000000002'))->true();
    }

    public function testCanAccessPrivateProjectOnlyOwner(): void
    {
        $project = Project::findOne(['key' => 'PRIV']);

        // Owner has access
        verify($project->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        // Non-owner does not
        verify($project->canAccess('01900000-0000-0000-0000-000000000002'))->false();
    }

    public function testCanAccessTeamProjectOnlyMembers(): void
    {
        $project = Project::findOne(['key' => 'TEAM']);

        // Owner is a project member
        verify($project->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        // jane.doe is a team project member  
        verify($project->canAccess('01900000-0000-0000-0000-000000000002'))->true();
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetOrganization(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->organization)->notNull();
        verify($project->organization->slug)->equals('test-org');
    }

    public function testGetOwner(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->owner)->notNull();
        verify($project->owner->username)->equals('bayer.hudson');
    }

    public function testGetProjectMembers(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->projectMembers)->notEmpty();
    }

    public function testGetLabels(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->labels)->notEmpty();
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testStatusConstants(): void
    {
        verify(Project::STATUS_ACTIVE)->equals('active');
        verify(Project::STATUS_ON_HOLD)->equals('on_hold');
        verify(Project::STATUS_COMPLETED)->equals('completed');
    }

    public function testVisibilityConstants(): void
    {
        verify(Project::VISIBILITY_PUBLIC)->equals('public');
        verify(Project::VISIBILITY_PRIVATE)->equals('private');
        verify(Project::VISIBILITY_TEAM)->equals('team');
    }

    public function testPriorityConstants(): void
    {
        verify(Project::PRIORITY_LOW)->equals(0);
        verify(Project::PRIORITY_MEDIUM)->equals(1);
        verify(Project::PRIORITY_HIGH)->equals(2);
        verify(Project::PRIORITY_CRITICAL)->equals(3);
    }
}
