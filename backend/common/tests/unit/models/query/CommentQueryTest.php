<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\CommentFixture;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\UserFixture;
use common\models\Comment;

class CommentQueryTest extends Unit
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
            'comment' => [
                'class'    => CommentFixture::class,
                'dataFile' => codecept_data_dir() . 'comment.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingComment(): void
    {
        $result = Comment::find()
            ->byId('01900000-0000-7005-8000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->content)->equals('This is a test comment on the issue.');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Comment::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byIssueId
    // -------------------------------------------------------------------------

    public function testByIssueIdReturnsAllCommentsForIssue(): void
    {
        $results = Comment::find()
            ->byIssueId('01900000-0000-7004-8000-000000000001')
            ->all();

        foreach ($results as $result) {
            verify($result->issue_id)->equals('01900000-0000-7004-8000-000000000001');
        }
    }

    public function testByIssueIdReturnsSingleCommentForIssue(): void
    {
        $results = Comment::find()
            ->byIssueId('01900000-0000-7004-8000-000000000002')
            ->all();

        foreach ($results as $result) {
            verify($result->issue_id)->equals('01900000-0000-7004-8000-000000000002');
        }
    }

    public function testByIssueIdReturnsEmptyForUnknownIssue(): void
    {
        $results = Comment::find()
            ->byIssueId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byCreatorId
    // -------------------------------------------------------------------------

    public function testByCreatorIdReturnsCommentsCreatedByUser(): void
    {
        // user 1 created comments 2 and 3
        $results = Comment::find()
            ->byCreatorId('01900000-0000-7000-8000-000000000001')
            ->all();

        foreach ($results as $result) {
            verify($result->created_by)->equals('01900000-0000-7000-8000-000000000001');
        }
    }

    public function testByCreatorIdReturnsOneCommentForSecondUser(): void
    {
        // user 2 created comment 1
        $results = Comment::find()
            ->byCreatorId('01900000-0000-7000-8000-000000000002')
            ->all();

        foreach ($results as $result) {
            verify($result->created_by)->equals('01900000-0000-7000-8000-000000000002');
        }
    }

    public function testByCreatorIdReturnsEmptyForUnknownUser(): void
    {
        $results = Comment::find()
            ->byCreatorId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byUpdatorId
    // -------------------------------------------------------------------------

    public function testByUpdatorIdReturnsCommentsUpdatedByUser(): void
    {
        // user 2 updated comment 1; user 1 updated comment 3
        $results = Comment::find()
            ->byUpdatorId('01900000-0000-7000-8000-000000000002')
            ->all();

        foreach ($results as $result) {
            verify($result->updated_by)->equals('01900000-0000-7000-8000-000000000002');
        }
    }

    public function testByUpdatorIdReturnsEmptyForUnknownUser(): void
    {
        $results = Comment::find()
            ->byUpdatorId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byProjectId
    // -------------------------------------------------------------------------

    public function testByProjectIdReturnsAllCommentsInProject(): void
    {
        // All 3 fixture comments belong to issues in project TEST
        $results = Comment::find()
            ->byProjectId('01900000-0000-7002-8000-000000000001')
            ->all();

        foreach ($results as $result) {
            verify($result->issue->project_id)->equals('01900000-0000-7002-8000-000000000001');
        }
    }

    public function testByProjectIdReturnsEmptyForUnknownProject(): void
    {
        $results = Comment::find()
            ->byProjectId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByIssueIdAndByCreatorId(): void
    {
        // In issue TEST-1, comment by user 1 is comment 2
        $result = Comment::find()
            ->byIssueId('01900000-0000-7004-8000-000000000001')
            ->byCreatorId('01900000-0000-7000-8000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-7005-8000-000000000002');
    }
}
