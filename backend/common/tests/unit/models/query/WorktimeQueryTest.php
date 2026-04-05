<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\UserFixture;
use common\fixtures\WorktimeFixture;
use common\models\Worktime;

class WorktimeQueryTest extends Unit
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
            'worktime' => [
                'class'    => WorktimeFixture::class,
                'dataFile' => codecept_data_dir() . 'worktime.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingRecord(): void
    {
        $result = Worktime::find()
            ->byId('01900000-0000-7006-8000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->minutes_spent)->equals(90);
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Worktime::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byIssueId
    // -------------------------------------------------------------------------

    public function testByIssueIdReturnsTwoRecordsForFirstIssue(): void
    {
        $results = Worktime::find()
            ->byIssueId('01900000-0000-7004-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->issue_id)->equals('01900000-0000-7004-8000-000000000001');
        }
    }

    public function testByIssueIdReturnsSingleRecordForSecondIssue(): void
    {
        $results = Worktime::find()
            ->byIssueId('01900000-0000-7004-8000-000000000002')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->issue_id)->equals('01900000-0000-7004-8000-000000000002');
        }
    }

    public function testByIssueIdReturnsEmptyForUnknownIssue(): void
    {
        $results = Worktime::find()
            ->byIssueId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byProjectId
    // -------------------------------------------------------------------------

    public function testByProjectIdReturnsAllRecordsInProject(): void
    {
        // All 3 worktime records are in project TEST (project1)
        $results = Worktime::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->issue->project_id)->equals('01900000-0000-7002-8000-000000000001');
        }
    }

    public function testByProjectIdReturnsEmptyForProjectWithNoWorktimes(): void
    {
        // Project PRIV (project2) has no issues with worktimes
        $results = Worktime::find()
            ->byProjectId('01900000-0000-7002-8000-000000000002')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byCreatedBy
    // -------------------------------------------------------------------------

    public function testByCreatedByReturnsTwoRecordsForFirstUser(): void
    {
        // user1 logged worktime on records 1 and 3
        $results = Worktime::find()
            ->byCreatedBy('01900000-0000-7000-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->created_by)->equals('01900000-0000-7000-8000-000000000001');
        }
    }

    public function testByCreatedByReturnsSingleRecordForSecondUser(): void
    {
        // user2 logged worktime on record 2
        $results = Worktime::find()
            ->byCreatedBy('01900000-0000-7000-8000-000000000002')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->created_by)->equals('01900000-0000-7000-8000-000000000002');
        }
    }

    public function testByCreatedByReturnsEmptyForUnknownUser(): void
    {
        $results = Worktime::find()
            ->byCreatedBy('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byOrganizationId
    // -------------------------------------------------------------------------

    public function testByOrganizationIdReturnsAllRecordsForOrg(): void
    {
        // All 3 worktime records belong to issues in projects under org1
        $results = Worktime::find()
            ->byOrganizationId('01900000-0000-7001-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->issue->project->organization_id)->equals('01900000-0000-7001-8000-000000000001');
        }
    }

    public function testByOrganizationIdReturnsEmptyForOrgWithNoWorktimes(): void
    {
        // org2 has no projects with issues
        $results = Worktime::find()
            ->byOrganizationId('01900000-0000-7001-8000-000000000002')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByIssueIdAndByCreatedBy(): void
    {
        $result = Worktime::find()
            ->byIssueId('01900000-0000-7004-8000-000000000001')
            ->byCreatedBy('01900000-0000-7000-8000-000000000002')
            ->one();

        verify($result)->notNull();
        verify($result->minutes_spent)->equals(30);
    }

    public function testChainingByProjectIdAndByCreatedBy(): void
    {
        $results = Worktime::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->byCreatedBy('01900000-0000-7000-8000-000000000001')
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $worktime) {
            verify($worktime->issue->project_id)->equals('01900000-0000-7002-8000-000000000001');
            verify($worktime->created_by)->equals('01900000-0000-7000-8000-000000000001');
        }
    }
}
