<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\CommentPermissionService;
use api\components\permissions\Permissions;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\CommentFixture;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Comment;

class CommentPermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID    = '01900000-0000-7000-8000-000000000001'; // org1 owner
    private const USER2_ID    = '01900000-0000-7000-8000-000000000002'; // org1 member
    private const USER3_ID    = '01900000-0000-7000-8000-000000000003'; // org1 admin
    private const USER4_ID    = '01900000-0000-7000-8000-000000000004'; // not a member
    private const USER7_ID    = '01900000-0000-7000-8000-000000000007'; // project member
    private const PROJ1_ID    = '01900000-0000-7002-8000-000000000001';
    private const COMMENT1_ID = '01900000-0000-7005-8000-000000000001'; // issue1, created_by user7
    private const COMMENT2_ID = '01900000-0000-7005-8000-000000000002'; // issue1, created_by user1

    public function _fixtures(): array
    {
        return [
            'users'               => UserFixture::class,
            'organizations'       => OrganizationFixture::class,
            'organizationMembers' => OrganizationMemberFixture::class,
            'projects'            => ProjectFixture::class,
            'projectMembers'      => ProjectMemberFixture::class,
            'labels'              => LabelFixture::class,
            'issues'              => IssueFixture::class,
            'comments'            => CommentFixture::class,
        ];
    }

    // -------------------------------------------------------------------------
    // canViewComment
    // -------------------------------------------------------------------------

    public function testCanViewCommentForMember()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(CommentPermissionService::canViewComment($comment, self::USER2_ID));
    }

    public function testCannotViewCommentForNonMember()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertFalse(CommentPermissionService::canViewComment($comment, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canCreateComment
    // -------------------------------------------------------------------------

    public function testCanCreateCommentForMember()
    {
        $this->assertTrue(CommentPermissionService::canCreateComment(self::PROJ1_ID, self::USER2_ID));
    }

    public function testCannotCreateCommentForNonMember()
    {
        $this->assertFalse(CommentPermissionService::canCreateComment(self::PROJ1_ID, self::USER4_ID));
    }

    // -------------------------------------------------------------------------
    // canDeleteComment
    // -------------------------------------------------------------------------

    public function testCanDeleteCommentViaDeleteAnyPermission()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(CommentPermissionService::canDeleteComment($comment, self::USER3_ID));
    }

    public function testCanDeleteCommentViaOwnership()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(CommentPermissionService::canDeleteComment($comment, self::USER7_ID));
    }

    public function testCannotDeleteCommentWithoutPermissionOrOwnership()
    {
        $comment = Comment::findOne(self::COMMENT2_ID);
        $this->assertFalse(CommentPermissionService::canDeleteComment($comment, self::USER7_ID));
    }

    // -------------------------------------------------------------------------
    // canUpdateComment
    // -------------------------------------------------------------------------

    public function testCanUpdateCommentViaUpdateAnyPermission()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(CommentPermissionService::canUpdateComment($comment, self::USER3_ID));
    }

    public function testCanUpdateCommentViaOwnership()
    {
        $comment = Comment::findOne(self::COMMENT1_ID);
        $this->assertTrue(CommentPermissionService::canUpdateComment($comment, self::USER7_ID));
    }

    public function testCannotUpdateCommentWithoutPermissionOrOwnership()
    {
        $comment = Comment::findOne(self::COMMENT2_ID);
        $this->assertFalse(CommentPermissionService::canUpdateComment($comment, self::USER2_ID));
    }
}
