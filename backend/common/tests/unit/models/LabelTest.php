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
use common\models\Label;
use common\tests\UnitTester;
use Exception;
use Yii;

class LabelTest extends Unit
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
            'issue' => [
                'class' => IssueFixture::class,
            ],
        ];
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
        $label = new Label();
        $label->project_id = '01900000-0000-0002-0000-000000000001';

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('name');
        verify($label->errors)->arrayHasKey('description');
        verify($label->errors)->arrayHasKey('color');
    }

    public function testNameMaxLength(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => str_repeat('x', 25), // max 24
            'description' => 'Too long name test',
            'color'       => '#fff',
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('name');
    }

    public function testDescriptionMaxLength(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'Test',
            'description' => str_repeat('x', 65), // max 64
            'color'       => '#fff',
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('description');
    }

    public function testColorMaxLength(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'ColorTest',
            'description' => 'Test',
            'color'       => '#1234567', // max 7 chars
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('color');
    }

    public function testColorMustBeValidHex(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'HexTest',
            'description' => 'Test',
            'color'       => 'red',
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('color');
    }

    public function testColorAcceptsShortHex(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'ShortHex',
            'description' => 'Test short hex color.',
            'color'       => '#abc',
        ]);

        verify($label->validate(['color']))->true();
    }

    public function testColorAcceptsFullHex(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'FullHex',
            'description' => 'Test full hex color.',
            'color'       => '#aabbcc',
        ]);

        verify($label->validate(['color']))->true();
    }

    public function testProjectIdMustExist(): void
    {
        $_GET['project_id'] = '00000000-0000-0000-0000-000000000099';
        $label = new Label([
            'name'        => 'BadProject',
            'description' => 'Test FK',
            'color'       => '#fff',
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('project_id');
    }

    public function testDuplicateNameInSameProjectFails(): void
    {
        $label = $this->tester->grabFixture('label', 3); // "In Progress" label in TEST project
        $_GET['project_id'] = $label['project_id'];
        $label = new Label([
            'name'        => $label['name'], // already exists in project
            'description' => 'Duplicate test',
            'color'       => '#fff',
        ]);

        verify($label->validate())->false();
        verify($label->errors)->arrayHasKey('name');
        verify($label->getErrors('name'))->arrayContains('A label with this name already exists in the project.');
    }

    public function testSameNameInDifferentProjectPasses(): void
    {
        $_GET['project_id'] = '01900000-0000-0002-0000-000000000002';
        // PRIV project doesn't have "In Progress" label yet
        $label = new Label([
            'name'        => 'In Progress',
            'description' => 'Same name, different project.',
            'color'       => '#f59e0b',
        ]);

        verify($label->validate())->true();
    }

    public function testValidDataPassesValidation(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'Review',
            'description' => 'Needs review.',
            'color'       => '#3b82f6',
        ]);

        verify($label->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID / index generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuidAndIndex(): void
    {
        $_GET['project_id'] = '01900000-0000-0002-0000-000000000001';

        $label = new Label([
            'name'        => 'NewLabel',
            'description' => 'A brand new label.',
            'color'       => '#8b5cf6',
        ]);

        $saved = $label->save();
        verify($saved)->true();
        verify($label->id)->notEmpty();
        verify($label->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
        // Index should be max(index) + 1 for the project
        verify($label->index)->greaterThan(0);
    }

    public function testSaveBeforeFailsWhenParentBeforeSaveFails(): void
    {
        $label = new Label([
            'project_id'  => '01900000-0000-0002-0000-000000000001',
            'name'        => 'FailSave',
            'description' => 'This should fail to save.',
            'color'       => '#8b5cf6',
        ]);

        $label->on(Label::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false; // Simulate parent beforeSave failure
        });

        verify($label->save())->false();
    }


    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureLabels(): void
    {
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        verify($open)->notNull();
        verify($open->name)->equals(Label::STATUS_OPEN);
        verify($open->color)->equals('#22c55e');
        verify($open->index)->equals(1);

        $closed = Label::findOne('01900000-0000-0003-0000-000000000002');
        verify($closed)->notNull();
        verify($closed->name)->equals(Label::STATUS_CLOSED);
        verify($closed->color)->equals('#ef4444');
        verify($closed->index)->equals(2);

        $inProgress = Label::findOne('01900000-0000-0003-0000-000000000003');
        verify($inProgress)->notNull();
        verify($inProgress->name)->equals('In Progress');
        verify($inProgress->index)->equals(3);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetProjectIsNull(): void
    {
        $fixture = $this->tester->grabFixture('label', 0); // Open label with null project_id
        $label = Label::findOne($fixture['id']);
        verify($label->project)->null();
    }

    public function testGetProjectNotNull(): void
    {
        $fixture = $this->tester->grabFixture('label', 2); // In Progress label linked to TEST project
        $label = Label::findOne($fixture['id']);
        verify($label->project)->notNull();
        verify($label->project->key)->equals('TEST');
    }

    public function testGetIssues(): void
    {
        // Open label has issues linked to it
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        verify($open->issues)->notEmpty();

        // In Progress label has issues linked
        $inProgress = Label::findOne('01900000-0000-0003-0000-000000000003');
        verify($inProgress->issues)->notEmpty();
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    public function testCanAccessViaProject(): void
    {
        $fixture = $this->tester->grabFixture('label', 2); // In Progress label linked to TEST project
        $label = Label::findOne($fixture['id']);
        // Public project - org members can access
        verify($label->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        verify($label->canAccess('01900000-0000-0000-0000-000000000002'))->true();
    }

    public function testCanAccessReturnsFalseWithNoProject(): void
    {
        $label = new Label();
        verify($label->canAccess('01900000-0000-0000-0000-000000000001'))->false();
    }

    // -------------------------------------------------------------------------
    // Reorder
    // -------------------------------------------------------------------------

    public function testReorderLabel(): void
    {
        // Open label is index 1, Closed is 2, In Progress is 3
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        verify($open->index)->equals(1);

        $result = $open->reorder(3);
        verify($result)->true();

        // Refresh from DB
        $open->refresh();
        verify($open->index)->equals(3);

        // Closed should have shifted from 2 to 1
        $closed = Label::findOne('01900000-0000-0003-0000-000000000002');
        $closed->refresh();
        verify($closed->index)->equals(1);
    }

    public function testReorderSameIndexIsNoop(): void
    {
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        $originalIndex = $open->index;

        $result = $open->reorder($originalIndex);
        verify($result)->true();

        $open->refresh();
        verify($open->index)->equals($originalIndex);
    }

    public function testReorderExceptionWhenInvalidIndex(): void
    {
        $label = Label::findOne('01900000-0000-0003-0000-000000000003');

        $label->on(Label::EVENT_BEFORE_UPDATE, function ($event) {
            throw new Exception('Simulated failure in beforeUpdate');
            $event->isValid = false;
        });
        $this->expectException(Exception::class);
        $label->reorder(0);
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testStatusConstants(): void
    {
        verify(Label::STATUS_OPEN)->equals('Open');
        verify(Label::STATUS_CLOSED)->equals('Closed');
    }

    // -------------------------------------------------------------------------
    // beforeDelete
    // -------------------------------------------------------------------------

    public function testCannotDeleteLabelInUse(): void
    {
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        // This label is used by issues, so delete should throw

        $this->expectException(\yii\web\ConflictHttpException::class);
        $open->delete();
    }

    // -------------------------------------------------------------------------
    // getLabelCacheKey
    // -------------------------------------------------------------------------

    public function testGetLabelCacheKeyWithoutProjectId(): void
    {
        $key = Label::getLabelCacheKey('open');
        verify($key)->equals('issue_label_open');
    }

    public function testGetLabelCacheKeyWithProjectId(): void
    {
        $key = Label::getLabelCacheKey('closed', '01900000-0000-0002-0000-000000000001');
        verify($key)->stringContainsString('closed');
        verify($key)->stringContainsString('01900000-0000-0002-0000-000000000001');
    }

    // -------------------------------------------------------------------------
    // fields / extraFields
    // -------------------------------------------------------------------------

    public function testFields(): void
    {
        $label = Label::findOne('01900000-0000-0003-0000-000000000001');
        $fields = $label->fields();

        verify($fields)->arrayContains('id');

        verify($fields)->arrayContains('name');
        verify($fields)->arrayContains('color');
        verify($fields)->arrayContains('description');
        verify($fields)->arrayHasKey('projectId');
        verify($fields)->arrayContains('project_id');
    }

    public function testExtraFields(): void
    {
        $label = Label::findOne('01900000-0000-0003-0000-000000000001');
        $extra = $label->extraFields();

        verify($extra)->arrayContains('project');
    }

    // -------------------------------------------------------------------------
    // Reorder — move-down path
    // -------------------------------------------------------------------------

    public function testReorderLabelMoveDown(): void
    {
        // Open=1, Closed=2, InProgress=3; move Closed (index 2) to index 1
        $closed = Label::findOne('01900000-0000-0003-0000-000000000002');
        verify($closed->index)->equals(2);

        $result = $closed->reorder(1);
        verify($result)->true();

        $closed->refresh();
        verify($closed->index)->equals(1);

        // Open should have shifted from 1 to 2
        $open = Label::findOne('01900000-0000-0003-0000-000000000001');
        $open->refresh();
        verify($open->index)->equals(2);
    }

    // -------------------------------------------------------------------------
    // beforeValidate — missing project_id
    // -------------------------------------------------------------------------

    public function testBeforeValidateFailsWhenProjectIdMissing(): void
    {
        unset($_GET['project_id']);
        $label = new Label([
            'name'        => 'NoProject',
            'description' => 'Missing project ID.',
            'color'       => '#abc',
        ]);

        verify($label->validate())->false();
        verify($label->getErrors('project_id'))->arrayContains('Project ID is required.');
    }

    public function testBeforeValidateFailsWhenParentBeforeValidateFails(): void
    {
        $label = new Label([]);

        $label->on(Label::EVENT_BEFORE_VALIDATE, function ($event) {
            $event->isValid = false; // Simulate parent beforeValidate failure
        });

        verify($label->validate())->false();
    }

    public function testBeforeValidatePassesWhenNotNewProject(): void
    {
        $label = Label::findOne('01900000-0000-0003-0000-000000000003'); // Existing label

        $_GET['project_id'] = $label->project_id;
        $label->name = 'Updated Name';

        verify($label->save())->true();
    }
}
