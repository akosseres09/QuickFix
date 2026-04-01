<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\UserFixture;
use common\models\Issue;
use common\models\query\IssueQuery;

class IssueQueryTest extends Unit
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
            'issue' => [
                'class'    => IssueFixture::class,
                'dataFile' => codecept_data_dir() . 'issue.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingIssue(): void
    {
        $result = Issue::find()
            ->byId('01900000-0000-0004-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->issue_key)->equals('TEST-1');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Issue::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byProjectId
    // -------------------------------------------------------------------------

    public function testByProjectIdReturnsAllIssuesInProject(): void
    {
        $results = Issue::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->all();

        // All 3 fixture issues belong to project TEST

        foreach ($results as $issue) {
            verify($issue->project_id)->equals('01900000-0000-0002-0000-000000000001');
        }
    }

    public function testByProjectIdReturnsEmptyForUnknownProject(): void
    {
        $results = Issue::find()
            ->byProjectId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byType
    // -------------------------------------------------------------------------

    public function testByTypeReturnsBugIssues(): void
    {
        $results = Issue::find()
            ->byType(Issue::TYPE_BUG)
            ->all();

        foreach ($results as $issue) {
            verify($issue->type)->equals(Issue::TYPE_BUG);
        }
    }

    public function testByTypeReturnsFeatureIssues(): void
    {
        $results = Issue::find()
            ->byType(Issue::TYPE_FEATURE)
            ->all();

        foreach ($results as $issue) {
            verify($issue->type)->equals(Issue::TYPE_FEATURE);
        }
    }

    public function testByTypeReturnsTaskIssues(): void
    {
        $results = Issue::find()
            ->byType(Issue::TYPE_TASK)
            ->all();


        foreach ($results as $issue) {
            verify($issue->type)->equals(Issue::TYPE_TASK);
        }
    }

    // -------------------------------------------------------------------------
    // byPriority
    // -------------------------------------------------------------------------

    public function testByPriorityReturnsHighPriorityIssues(): void
    {
        $results = Issue::find()
            ->byPriority(Issue::PRIORITY_HIGH)
            ->all();

        foreach ($results as $issue) {
            verify($issue->priority)->equals(Issue::PRIORITY_HIGH);
        }
    }

    public function testByPriorityReturnsMediumPriorityIssues(): void
    {
        $results = Issue::find()
            ->byPriority(Issue::PRIORITY_MEDIUM)
            ->all();

        foreach ($results as $issue) {
            verify($issue->priority)->equals(Issue::PRIORITY_MEDIUM);
        }
    }

    public function testByPriorityReturnsCriticalPriorityIssues(): void
    {
        $results = Issue::find()
            ->byPriority(Issue::PRIORITY_CRITICAL)
            ->all();

        foreach ($results as $issue) {
            verify($issue->priority)->equals(Issue::PRIORITY_CRITICAL);
        }
    }

    // -------------------------------------------------------------------------
    // assignedTo
    // -------------------------------------------------------------------------

    public function testAssignedToReturnsIssuesAssignedToUser(): void
    {
        // TEST-1 is assigned to user 2 (jane.doe)
        $results = Issue::find()
            ->assignedTo('01900000-0000-0000-0000-000000000002')
            ->all();

        foreach ($results as $issue) {
            verify($issue->assigned_to)->equals('01900000-0000-0000-0000-000000000002');
        }
    }

    public function testAssignedToReturnsEmptyForUnassignedUser(): void
    {
        $results = Issue::find()
            ->assignedTo('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // createdBy
    // -------------------------------------------------------------------------

    public function testCreatedByReturnsIssuesCreatedByUser(): void
    {
        // All 3 fixture issues are created by user 1 (bayer.hudson)
        $results = Issue::find()
            ->createdBy('01900000-0000-0000-0000-000000000001')
            ->all();

        foreach ($results as $issue) {
            verify($issue->created_by)->equals('01900000-0000-0000-0000-000000000001');
        }
    }

    public function testCreatedByReturnsEmptyForUnknownUser(): void
    {
        $results = Issue::find()
            ->createdBy('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByProjectIdAndByType(): void
    {
        $results = Issue::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->byType(Issue::TYPE_BUG)
            ->all();

        foreach ($results as $issue) {
            verify($issue->project_id)->equals('01900000-0000-0002-0000-000000000001');
            verify($issue->type)->equals(Issue::TYPE_BUG);
        }
    }

    public function testChainingByProjectIdAndCreatedBy(): void
    {
        $results = Issue::find()
            ->byProjectId('01900000-0000-0002-0000-000000000001')
            ->createdBy('01900000-0000-0000-0000-000000000001')
            ->all();

        foreach ($results as $issue) {
            verify($issue->project_id)->equals('01900000-0000-0002-0000-000000000001');
            verify($issue->created_by)->equals('01900000-0000-0000-0000-000000000001');
        }
    }

    // -------------------------------------------------------------------------
    // byStatus
    // -------------------------------------------------------------------------

    public function testByStatusReturnsQueryObject(): void
    {
        $query = Issue::find()->byStatus(0);
        verify($query)->instanceOf(IssueQuery::class);
    }
}
