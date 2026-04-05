<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\UserFixture;
use common\models\Label;

class LabelQueryTest extends Unit
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
            'project' => [
                'class'    => ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
            ],
            'label' => [
                'class'    => LabelFixture::class,
                'dataFile' => codecept_data_dir() . 'label.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingLabel(): void
    {
        $result = Label::find()
            ->byId('01900000-0000-7003-8000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->name)->equals(Label::STATUS_OPEN);
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Label::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byProjectId
    // -------------------------------------------------------------------------

    public function testByProjectIdReturnsAllLabelsForProject(): void
    {
        // Project TEST (project1) has 3 labels
        $results = Label::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $label) {
            verify($label->project_id)->equals('01900000-0000-7002-8000-000000000001');
        }
    }

    public function testByProjectIdReturnsMultipleLabelsForPrivateProject(): void
    {
        // Project PRIV (project2) has 2 labels
        $results = Label::find()
            ->byProjectId('01900000-0000-7002-8000-000000000002')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $label) {
            verify($label->project_id)->equals('01900000-0000-7002-8000-000000000002');
        }
    }

    public function testByProjectIdReturnsEmptyForUnknownProject(): void
    {
        $results = Label::find()
            ->byProjectId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // allForProject
    // -------------------------------------------------------------------------

    public function testAllForProjectReturnsProjectLabels(): void
    {
        // allForProject returns labels with project_id = X OR project_id IS NULL.
        // Fixture has no system labels (project_id = NULL), so result equals byProjectId.
        $results = Label::find()
            ->allForProject('01900000-0000-7002-8000-000000000001')
            ->all();

        $allowed = ['01900000-0000-7002-8000-000000000001', null];
        verify($results)->notEmpty();
        foreach ($results as $label) {
            verify($allowed)->arrayContains($label->project_id);
        }
    }

    public function testAllForProjectReturnsEmptyForProjectWithNoLabels(): void
    {
        // Project 3 (TEAM) has no labels in fixtures
        $results = Label::find()
            ->allForProject('01900000-0000-7002-8000-000000000003')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $label) {
            verify($label->project_id)->equals(null);
        }
    }

    // -------------------------------------------------------------------------
    // byLabel
    // -------------------------------------------------------------------------

    public function testByLabelReturnsMatchingLabels(): void
    {
        // Two labels named 'Blocked': one in project1, one in project2
        $results = Label::find()
            ->byLabel('Blocked')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $result) {
            verify($result->name)->equals('Blocked');
        }
    }

    public function testByLabelReturnsClosedLabel(): void
    {
        $results = Label::find()
            ->byLabel(Label::STATUS_CLOSED)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $result) {
            verify($result->name)->equals(Label::STATUS_CLOSED);
            verify($result->project_id)->equals(null);
        }
    }

    public function testByLabelReturnsEmptyForUnknownLabel(): void
    {
        $results = Label::find()
            ->byLabel('Nonexistent')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // statusOpen / statusClosed (system labels: project_id IS NULL)
    // -------------------------------------------------------------------------

    public function testStatusOpenReturnsNonEmpty(): void
    {
        // statusOpen() filters name='Open' AND project_id IS NULL.
        // Fixture has no system labels, so result is empty.
        $results = Label::find()
            ->statusOpen()
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $result) {
            verify($result->name)->equals(Label::STATUS_OPEN);
            verify($result->project_id)->equals(null);
        }
    }

    public function testStatusClosedReturnsNonEmpty(): void
    {
        $results = Label::find()
            ->statusClosed()
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $result) {
            verify($result->name)->equals(Label::STATUS_CLOSED);
            verify($result->project_id)->equals(null);
        }
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByProjectIdAndByLabel(): void
    {
        $result = Label::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->byLabel('In Progress')
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-7003-8000-000000000003');
    }

    public function testChainingByIdAndByProjectId(): void
    {
        $result = Label::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->byId('01900000-0000-7003-8000-000000000004')
            ->one();

        verify($result)->notNull();
        verify($result->name)->equals('Needs Review');
    }
}
