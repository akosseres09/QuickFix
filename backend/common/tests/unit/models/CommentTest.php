<?php

namespace common\tests\unit\models;

use Codeception\Test\Unit;
use common\fixtures\CommentFixture;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Comment;
use common\models\User;
use Yii;

class CommentTest extends Unit
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
            'comment' => [
                'class' => CommentFixture::class,
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
        $_GET['issue_id'] = '01900000-0000-0004-0000-000000000001';
        return parent::_before();
    }

    protected function _after()
    {
        unset($_GET['project_id'], $_GET['issue_id']);
        return parent::_after();
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFieldsAreEnforced(): void
    {
        $comment = new Comment();

        verify($comment->validate())->false();
        verify($comment->errors)->arrayHasKey('content');
        verify($comment->getErrors('content'))->arrayContains('Content cannot be blank.');
    }

    public function testIssueIdIsRequired(): void
    {
        unset($_GET['issue_id']);
        $comment = new Comment([
            'content' => 'Some content',
        ]);
        verify($comment->validate())->false();
        verify($comment->errors)->arrayHasKey('issue_id');
        verify($comment->getErrors('issue_id'))->arrayContains('Issue ID is required.');
    }

    public function testIssueIdMustExist(): void
    {
        $_GET['issue_id'] = '00000000-0000-0000-0000-000000000099';
        $comment = new Comment([
            'content'  => 'Test content',
        ]);

        verify($comment->validate())->false();
        verify($comment->errors)->arrayHasKey('issue_id');
        verify($comment->getErrors('issue_id'))->arrayContains('Issue Id is invalid.');
    }

    public function testValidDataPassesValidation(): void
    {
        $comment = new Comment([
            'content'  => 'A valid comment',
        ]);

        verify($comment->validate())->true();
    }

    public function testContentCanContainHtml(): void
    {
        $comment = new Comment([
            'content'  => '<p>HTML content <strong>with tags</strong></p>',
        ]);

        verify($comment->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $this->loginFixtureUser();

        $comment = new Comment([
            'content' => 'A new comment',
        ]);

        $saved = $comment->save();
        verify($saved)->true();
        verify($comment->id)->notEmpty();
        verify($comment->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    // -------------------------------------------------------------------------
    // Fixture data lookups
    // -------------------------------------------------------------------------

    public function testFindFixtureComments(): void
    {
        $comment1 = Comment::findOne('01900000-0000-0005-0000-000000000001');
        verify($comment1)->notNull();
        verify($comment1->content)->equals('This is a test comment on the issue.');
        verify($comment1->issue_id)->equals('01900000-0000-0004-0000-000000000001');

        $comment2 = Comment::findOne('01900000-0000-0005-0000-000000000002');
        verify($comment2)->notNull();
        verify($comment2->content)->stringContainsString('HTML');

        $comment3 = Comment::findOne('01900000-0000-0005-0000-000000000003');
        verify($comment3)->notNull();
        verify($comment3->issue_id)->equals('01900000-0000-0004-0000-000000000002');
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetIssue(): void
    {
        $comment = Comment::findOne('01900000-0000-0005-0000-000000000001');
        verify($comment->issue)->notNull();
        verify($comment->issue->issue_key)->equals('TEST-1');
    }

    public function testGetCreator(): void
    {
        $comment = Comment::findOne('01900000-0000-0005-0000-000000000001');
        verify($comment->creator)->notNull();
        verify($comment->creator->username)->equals('jane.doe');
    }

    public function testGetUpdator(): void
    {
        $comment = Comment::findOne('01900000-0000-0005-0000-000000000001');
        verify($comment->updator)->notNull();

        $comment2 = Comment::findOne('01900000-0000-0005-0000-000000000002');
        verify($comment2->updator)->null();
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    public function testCanAccessViaIssueAndProject(): void
    {
        $comment = Comment::findOne('01900000-0000-0005-0000-000000000001');

        // Public project - org members can access
        verify($comment->canAccess('01900000-0000-0000-0000-000000000001'))->true();
        verify($comment->canAccess('01900000-0000-0000-0000-000000000002'))->true();
    }

    public function testCanAccessReturnsFalseWithNoIssue(): void
    {
        $comment = new Comment();
        verify($comment->canAccess('01900000-0000-0000-0000-000000000001'))->false();
    }
}
