<?php

namespace common\tests\unit\models;

use Codeception\Test\Unit;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Issue;
use common\models\Label;
use common\models\User;
use Yii;

class IssueTest extends Unit
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
            'project' => [
                'class' => ProjectFixture::class,
            ],
            'project_member' => [
                'class' => ProjectMemberFixture::class,
            ],
            'label' => [
                'class' => LabelFixture::class,
            ],
            'issue' => [
                'class' => IssueFixture::class,
            ],
        ];
    }

    private function loginFixtureUser(): User
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        Yii::$app->user->setIdentity($user);
        return $user;
    }

    protected function _before()
    {
        $_GET['project_id'] = '01900000-0000-0002-0000-000000000001';
        parent::_before();
    }

    protected function _after()
    {
        unset($_GET['project_id']);
        parent::_after();
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFieldsAreEnforced(): void
    {
        $issue = new Issue();

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('title');
        verify($issue->errors)->arrayHasKey('status_label');
    }

    public function testTitleMaxLength(): void
    {
        $issue = new Issue([
            'title'        => str_repeat('a', 256),
            'status_label' => '01900000-0000-0003-0000-000000000001',
        ]);

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('title');
    }

    public function testTypeMustBeInRange(): void
    {
        $issue = new Issue([
            'title'        => 'Test',
            'status_label' => '01900000-0000-0003-0000-000000000001',
            'type'         => 99,
        ]);

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('type');
    }

    public function testPriorityMustBeInRange(): void
    {
        $issue = new Issue([
            'title'        => 'Test',
            'status_label' => '01900000-0000-0003-0000-000000000001',
            'priority'     => 99,
        ]);

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('priority');
    }

    public function testDefaultValues(): void
    {
        $issue = new Issue();
        $issue->validate();

        verify($issue->type)->equals(Issue::TYPE_TASK);
        verify($issue->priority)->equals(Issue::PRIORITY_MEDIUM);
        verify($issue->is_archived)->equals(false);
        verify($issue->is_draft)->equals(false);
    }

    public function testProjectIdMustExist(): void
    {
        $_GET['project_id'] = '00000000-0000-0000-0000-000000000099';
        $issue = new Issue([
            'title'        => 'FK Test',
            'status_label' => '01900000-0000-0003-0000-000000000001',
        ]);

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('project_id');
    }

    public function testStatusLabelMustExist(): void
    {
        $issue = new Issue([
            'title'        => 'Bad Label',
            'status_label' => '00000000-0000-0000-0000-000000000099',
        ]);

        verify($issue->validate())->false();
        verify($issue->errors)->arrayHasKey('status_label');
    }

    public function testBooleanFields(): void
    {
        $issue = new Issue([
            'title'        => 'Bool Test',
            'status_label' => '01900000-0000-0003-0000-000000000001',
            'is_archived'  => true,
            'is_draft'     => true,
        ]);

        verify($issue->validate(['is_archived', 'is_draft']))->true();
    }

    public function testValidDataPassesValidation(): void
    {
        $issue = new Issue([
            'title'        => 'A valid issue',
            'status_label' => '01900000-0000-0003-0000-000000000001',
            'created_by'   => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($issue->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuidAndIssueKey(): void
    {
        $this->loginFixtureUser();

        $issue = new Issue([
            'title'        => 'New Issue',
            'status_label' => '01900000-0000-0003-0000-000000000001',
            'type'         => Issue::TYPE_FEATURE,
            'priority'     => Issue::PRIORITY_LOW,
        ]);

        $saved = $issue->save();
        verify($saved)->true();
        verify($issue->id)->notEmpty();
        verify($issue->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
        verify($issue->issue_key)->stringStartsWith('TEST-');
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureIssues(): void
    {
        $bug = Issue::findOne(['issue_key' => 'TEST-1']);
        verify($bug)->notNull();
        verify($bug->title)->equals('Fix login button alignment');
        verify($bug->type)->equals(Issue::TYPE_BUG);
        verify($bug->priority)->equals(Issue::PRIORITY_HIGH);
        verify($bug->is_draft)->false();
        verify($bug->assigned_to)->equals('01900000-0000-0000-0000-000000000002');

        $feature = Issue::findOne(['issue_key' => 'TEST-2']);
        verify($feature)->notNull();
        verify($feature->type)->equals(Issue::TYPE_FEATURE);
        verify($feature->priority)->equals(Issue::PRIORITY_MEDIUM);
        verify($feature->is_draft)->true();
        verify($feature->closed_at)->notNull();

        $task = Issue::findOne(['issue_key' => 'TEST-3']);
        verify($task)->notNull();
        verify($task->type)->equals(Issue::TYPE_TASK);
        verify($task->priority)->equals(Issue::PRIORITY_CRITICAL);
        verify($task->is_archived)->true();
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetProject(): void
    {
        $issue = Issue::findOne(['issue_key' => 'TEST-1']);
        verify($issue->project)->notNull();
        verify($issue->project->key)->equals('TEST');
    }

    public function testGetCreator(): void
    {
        $issue = Issue::findOne(['issue_key' => 'TEST-1']);
        verify($issue->creator)->notNull();
        verify($issue->creator->username)->equals('bayer.hudson');
    }

    public function testGetAssignee(): void
    {
        $issue = Issue::findOne(['issue_key' => 'TEST-1']);
        verify($issue->assignee)->notNull();
        verify($issue->assignee->username)->equals('jane.doe');

        $unassigned = Issue::findOne(['issue_key' => 'TEST-2']);
        verify($unassigned->assignee)->null();
    }

    public function testGetLabel(): void
    {
        $issue = Issue::findOne(['issue_key' => 'TEST-1']);
        verify($issue->label)->notNull();
        verify($issue->label->name)->equals(Label::STATUS_OPEN);
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    public function testCanAccessViaProject(): void
    {
        $issue = Issue::findOne(['issue_key' => 'TEST-1']);

        // Public project - org members can access
        verify($issue->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        verify($issue->canAccess('01900000-0000-0000-0000-000000000002'))->true();
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testTypeConstants(): void
    {
        verify(Issue::TYPE_TASK)->equals(0);
        verify(Issue::TYPE_FEATURE)->equals(1);
        verify(Issue::TYPE_INCIDENT)->equals(2);
        verify(Issue::TYPE_BUG)->equals(3);
    }

    public function testPriorityConstants(): void
    {
        verify(Issue::PRIORITY_LOW)->equals(0);
        verify(Issue::PRIORITY_MEDIUM)->equals(1);
        verify(Issue::PRIORITY_HIGH)->equals(2);
        verify(Issue::PRIORITY_CRITICAL)->equals(3);
    }

    // -------------------------------------------------------------------------
    // generateIssueKey
    // -------------------------------------------------------------------------

    public function testGenerateIssueKeyFormat(): void
    {
        $issue = new Issue();
        $issue->project_id = $_GET['project_id'];

        $key = $issue->generateIssueKey();
        verify($key)->stringStartsWith('TEST-');
        // There are 3 fixture issues for this project, so the next should be TEST-4
        verify($key)->equals('TEST-4');
    }

    public function testGenerateIssueKeyReturnsNullForInvalidProject(): void
    {
        $issue = new Issue([
            'project_id' => '00000000-0000-0000-0000-000000000099',
        ]);

        $key = $issue->generateIssueKey();
        verify($key)->null();
    }
}
