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
use common\tests\UnitTester;
use Yii;
use yii\base\Event;

class ProjectTest extends Unit
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
            'issue' => [
                'class' => \common\fixtures\IssueFixture::class,
                'dataFile' => codecept_data_dir() . 'issue.php',
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

    public function testCannotAccessProject(): void
    {
        $project = new Project([
            'name' => 'No Access Project',
            'key'  => 'NOACC',
            'owner_id' => '01900000-0000-0000-0000-000000000002',
            'visibility' => 'None', // invalid visibility to ensure no access
        ]);

        verify($project->canAccess('01900000-0000-0000-0000-000000000001'))->false();
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

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    public function testGetKeyToIdCacheKey(): void
    {
        $key = Project::getKeyToIdCacheKey('01900000-0000-0001-0000-000000000001', 'TEST');
        verify($key)->equals('project_key_to_id_01900000-0000-0001-0000-000000000001_TEST');
    }

    public function testGetVisibilities(): void
    {
        $visibilities = Project::getVisibilities();
        verify($visibilities)->arrayHasKey(Project::VISIBILITY_PUBLIC);
        verify($visibilities)->arrayHasKey(Project::VISIBILITY_PRIVATE);
        verify($visibilities)->arrayHasKey(Project::VISIBILITY_TEAM);
        verify(count($visibilities))->equals(3);
    }

    public function testGetPriorities(): void
    {
        $priorities = Project::getPriorities();
        verify($priorities)->arrayHasKey(Project::PRIORITY_LOW);
        verify($priorities)->arrayHasKey(Project::PRIORITY_MEDIUM);
        verify($priorities)->arrayHasKey(Project::PRIORITY_HIGH);
        verify($priorities)->arrayHasKey(Project::PRIORITY_CRITICAL);
        verify(count($priorities))->equals(4);
    }

    // -------------------------------------------------------------------------
    // Fields / attributeLabels
    // -------------------------------------------------------------------------

    public function testAttributeLabels(): void
    {
        $project = new Project();
        $labels = $project->attributeLabels();
        verify($labels)->arrayHasKey('id');
        verify($labels['name'])->equals('Name');
        verify($labels['key'])->equals('Key');
        verify($labels['visibility'])->equals('Visibility');
    }

    public function testFields(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        $fields = $project->fields();
        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('name');
        verify($fields)->arrayContains('key');
        verify($fields)->arrayContains('description');
        verify($fields)->arrayContains('status');

        verify($fields)->arrayHasKey('ownerId');
        verify($fields)->arrayContains('owner_id');

        verify($fields)->arrayContains('visibility');
        verify($fields)->arrayContains('priority');

        verify($fields)->arrayHasKey('isArchived');
        verify($fields)->arrayContains('is_archived');

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');

        verify($fields)->arrayHasKey('archivedAt');
        verify($fields)->arrayContains('archived_at');

        verify($fields)->arrayHasKey('updatedBy');
        verify($fields)->arrayContains('updated_by');
    }

    public function testExtraFields(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        $extra = $project->extraFields();
        $members = $extra['members'];
        $projectMembers = $extra['projectMembers'];
        $issueCount = $extra['issueCount'];
        $memberCount = $extra['memberCount'];

        verify($extra)->arrayHasKey('members');
        verify($members)->isCallable();
        verify($extra)->arrayHasKey('projectMembers');
        verify($projectMembers)->isCallable();
        verify($extra)->arrayHasKey('issueCount');
        verify($issueCount)->isCallable();
        verify($extra)->arrayHasKey('memberCount');
        verify($memberCount)->isCallable();
        verify($extra)->arrayContains('owner');

        // Test that the callables return expected data
        verify($members())->notEmpty();
        verify($projectMembers())->notEmpty();
        verify($issueCount())->greaterThanOrEqual(0);
        verify($memberCount())->greaterThanOrEqual(0);
    }

    // -------------------------------------------------------------------------
    // Additional relations
    // -------------------------------------------------------------------------

    public function testGetIssues(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->issues)->notEmpty();
    }

    public function testGetMembers(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->members)->notEmpty();
    }

    public function testGetUpdator(): void
    {
        $project = Project::findOne(['key' => 'TEST']);
        verify($project->updator)->null(); // updated_by is null in fixture
    }

    public function testGetEffectiveProjectMembersForPublicProject(): void
    {
        $project = Project::findOne(['key' => 'TEST']); // PUBLIC
        $members = $project->getEffectiveProjectMembers();
        verify($members)->notEmpty();
    }

    public function testGetEffectiveProjectMembersForTeamProject(): void
    {
        $project = Project::findOne(['key' => 'TEAM']); // TEAM — returns stored members
        $members = $project->getEffectiveProjectMembers();
        verify($members)->notEmpty();
    }

    public function testGetEffectiveMembersForPublicProject(): void
    {
        $project = Project::findOne(['key' => 'TEST']); // PUBLIC
        $members = $project->getEffectiveMembers();
        verify($members)->notEmpty();
    }

    public function testGetEffectiveMembersForTeamProject(): void
    {
        $project = Project::findOne(['key' => 'TEAM']); // TEAM — returns stored members
        $members = $project->getEffectiveMembers();
        verify($members)->notEmpty();
    }

    // -------------------------------------------------------------------------
    // Status / visibility helpers
    // -------------------------------------------------------------------------

    public function testIsActive(): void
    {
        $active = Project::findOne(['key' => 'TEST']);
        verify($active->isActive())->true();

        $onHold = Project::findOne(['key' => 'PRIV']);
        verify($onHold->isActive())->false();
    }

    public function testIsTeamProject(): void
    {
        $team = Project::findOne(['key' => 'TEAM']);
        verify($team->isTeamProject())->true();

        $pub = Project::findOne(['key' => 'TEST']);
        verify($pub->isTeamProject())->false();
    }

    public function testIsPrivateProject(): void
    {
        $priv = Project::findOne(['key' => 'PRIV']);
        verify($priv->isPrivateProject())->true();

        $pub = Project::findOne(['key' => 'TEST']);
        verify($pub->isPrivateProject())->false();
    }

    public function testIsPublicProject(): void
    {
        $pub = Project::findOne(['key' => 'TEST']);
        verify($pub->isPublicProject())->true();

        $priv = Project::findOne(['key' => 'PRIV']);
        verify($priv->isPublicProject())->false();
    }

    // -------------------------------------------------------------------------
    // Membership checks
    // -------------------------------------------------------------------------

    public function testIsMemberForPublicProject(): void
    {
        $project = Project::findOne(['key' => 'TEST']); // PUBLIC

        // bayer.hudson is org owner → org member → project member
        verify($project->isMember('01900000-0000-0000-0000-000000000001'))->true();
        // jane.doe is org member
        verify($project->isMember('01900000-0000-0000-0000-000000000002'))->true();
        // random unknown user is not
        verify($project->isMember('00000000-0000-0000-0000-000000000099'))->false();
    }

    public function testIsMemberForTeamProject(): void
    {
        $project = Project::findOne(['key' => 'TEAM']); // TEAM

        // bayer.hudson is a stored project member
        verify($project->isMember('01900000-0000-0000-0000-000000000001'))->true();
        // jane.doe is a stored project member
        verify($project->isMember('01900000-0000-0000-0000-000000000002'))->true();
        // admin.user is NOT a stored project member of TEAM
        verify($project->isMember('01900000-0000-0000-0000-000000000003'))->false();
    }

    public function testIsMemberAdminForPublicProject(): void
    {
        $project = Project::findOne(['key' => 'TEST']); // PUBLIC

        // admin.user has ADMIN role in test-org → org-level admin
        verify($project->isMemberAdmin('01900000-0000-0000-0000-000000000003'))->true();
        // jane.doe has MEMBER role → not admin
        verify($project->isMemberAdmin('01900000-0000-0000-0000-000000000002'))->false();
    }

    public function testIsMemberAdminForNonExistentProject(): void
    {
        $project = new Project([
            'name' => 'Nonexistent Project',
            'key'  => 'NONEXIST',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
            'visibility' => Project::VISIBILITY_TEAM,
        ]);

        verify($project->isMemberAdmin('01900000-0000-0000-0000-000000000003'))->false();
    }

    public function testIsMemberAdminWhenProjectAdmin(): void
    {
        $projectMember = ProjectMember::findOne([
            'project_id' => '01900000-0000-0002-0000-000000000001', // TEST project
            'user_id'    => '01900000-0000-0000-0000-000000000002', // jane.doe
        ]);

        $projectMember->role = RoleManager::ROLE_ADMIN;
        $projectMember->save(false);

        $project = Project::findOne(['id' => '01900000-0000-0002-0000-000000000001']); // TEST project
        verify($project->isMemberAdmin('01900000-0000-0000-0000-000000000002'))->true();
    }

    // -------------------------------------------------------------------------
    // beforeValidate & beforeSave hooks
    // -------------------------------------------------------------------------

    public function testBeforeValidateMissingOrganizationId(): void
    {
        unset($_GET['organization_id']);

        $project = new Project([
            'name'     => 'No Org ID',
            'key'      => 'NOORGID',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($project->validate())->false();
        verify($project->errors)->arrayHasKey('organization_id');
    }

    public function testAfterSaveSetsArchivedAtValue(): void
    {
        $this->loginFixtureUser();

        $project = Project::findOne(['key' => 'TEST']); // not archived
        verify($project->archived_at)->null();

        $project->is_archived = true;
        $project->save(false);

        verify($project->archived_at)->notNull();

        // Unarchiving clears archived_at
        $project->is_archived = false;
        $project->save(false);

        verify($project->archived_at)->null();
    }

    public function testBeforeSaveFailsWhenParentBeforeSaveFails(): void
    {
        $project = new Project([
            'name'     => 'Invalid BeforeSave',
            'key'      => 'BADSAVE',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        $project->on(Project::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false;
        });

        verify($project->save())->false();
    }

    public function testAfterSaveCreatesOwnerMembershipOnNewProject(): void
    {
        $user = $this->loginFixtureUser();

        $project = new Project([
            'name' => 'AfterSave Membership',
            'key'  => 'AFTERM',
            'owner_id' => $user->id,
        ]);

        verify($project->save())->true();

        $member = ProjectMember::findOne([
            'project_id' => $project->id,
            'user_id'    => $user->id,
        ]);

        verify($member)->notNull();
        verify($member->role)->equals(RoleManager::ROLE_OWNER);
    }

    public function testAfterSaveDoesNotCreateOwnerMembershipOnNewProject(): void
    {
        $this->loginFixtureUser();
        $project = new Project([
            'name' => 'No Membership',
            'key'  => 'NOMEM',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        Event::on(ProjectMember::class, ProjectMember::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false; // prevent any new memberships from being created
        });
        // Trigger afterSave by saving the project
        $this->expectException(\yii\db\Exception::class);
        $this->expectExceptionMessage('Failed to add project owner as member.');
        $project->save();

        $projectExists = Project::find()->byKey($project->key)->exists();
        $projectMemberExists = ProjectMember::find()->byProjectId($project->id)->andWhere(['user_id' => $project->owner_id])->exists();
        verify($projectExists)->false(); // project should not be saved due to membership creation failure

        Event::off(ProjectMember::class, ProjectMember::EVENT_BEFORE_INSERT);
    }

    public function testBeforeValidateFailsWhenParentBeforeValidateFails(): void
    {
        $project = new Project([
            'name'     => 'Invalid Owner',
            'key'      => 'INVOWN',
            'owner_id' => '00000000-0000-0000-0000-000000000099', // non-existent
        ]);

        $project->on(Project::EVENT_BEFORE_VALIDATE, function ($event) {
            $event->isValid = false;
        });

        verify($project->validate())->false();
    }

    public function testBeforeValidateReturnsTrueWhenParentBeforeValidateReturnsTrue(): void
    {
        $project = Project::findOne(['key' => 'TEST']);

        verify($project->validate())->true();
        verify($project->errors)->empty();
    }
}
