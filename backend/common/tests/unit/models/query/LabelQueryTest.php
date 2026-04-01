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
            ->byId('01900000-0000-0003-0000-000000000001')
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
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->all();

        verify(count($results))->equals(3);
    }

    public function testByProjectIdReturnsSingleLabelForPrivateProject(): void
    {
        // Project PRIV (project2) has 1 label
        $results = Label::find()
            ->byProjectId('01900000-0000-0002-0000-000000000002')
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->name)->equals(Label::STATUS_OPEN);
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
            ->allForProject('01900000-0000-0002-0000-000000000001')
            ->all();

        verify(count($results))->equals(3);
    }

    public function testAllForProjectReturnsEmptyForProjectWithNoLabels(): void
    {
        // Project 3 (TEAM) has no labels in fixtures
        $results = Label::find()
            ->allForProject('01900000-0000-0002-0000-000000000003')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byLabel
    // -------------------------------------------------------------------------

    public function testByLabelReturnsMatchingLabels(): void
    {
        // Two labels named 'Open': one in project1, one in project2
        $results = Label::find()
            ->byLabel(Label::STATUS_OPEN)
            ->all();

        verify(count($results))->equals(2);
        foreach ($results as $result) {
            verify($result->name)->equals(Label::STATUS_OPEN);
        }
    }

    public function testByLabelReturnsClosedLabel(): void
    {
        $results = Label::find()
            ->byLabel(Label::STATUS_CLOSED)
            ->all();

        verify(count($results))->equals(1);
        verify($results[0]->project_id)->equals('01900000-0000-0002-0000-000000000001');
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

    public function testStatusOpenReturnsEmptyWhenNoSystemLabelsExist(): void
    {
        // statusOpen() filters name='Open' AND project_id IS NULL.
        // Fixture has no system labels, so result is empty.
        $results = Label::find()
            ->statusOpen()
            ->all();

        verify($results)->empty();
    }

    public function testStatusClosedReturnsEmptyWhenNoSystemLabelsExist(): void
    {
        $results = Label::find()
            ->statusClosed()
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByProjectIdAndByLabel(): void
    {
        $result = Label::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->byLabel(Label::STATUS_OPEN)
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-0003-0000-000000000001');
    }

    public function testChainingByIdAndByProjectId(): void
    {
        $result = Label::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->byId('01900000-0000-0003-0000-000000000002')
            ->one();

        verify($result)->notNull();
        verify($result->name)->equals(Label::STATUS_CLOSED);
    }
}
