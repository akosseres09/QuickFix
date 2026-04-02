<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\CommentFixture;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\UserRole;
use Yii;

class CommentControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG     = 'test-org';
    private const ORG_ID       = '01900000-0000-7001-8000-000000000001';
    private const PROJECT_KEY  = 'TEST';
    private const PROJECT_ID   = '01900000-0000-7002-8000-000000000001';
    private const ISSUE_ID     = '01900000-0000-7004-8000-000000000001';

    private const COMMENT_ID_1 = '01900000-0000-7005-8000-000000000001'; // created by MEMBER
    private const COMMENT_ID_2 = '01900000-0000-7005-8000-000000000002'; // created by OWNER

    private const OWNER_ID     = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL  = 'nicole.paucek@schultz.info';
    private const MEMBER_ID    = '01900000-0000-7000-8000-000000000002';
    private const MEMBER_EMAIL = 'jane.doe@example.com';
    private const OUTSIDER_ID  = '01900000-0000-7000-8000-000000000005';
    private const OUTSIDER_EMAIL = 'not.part.of.any.organization@example.com';

    // ── Fixtures ─────────────────────────────────────────────────────────────

    public function _fixtures(): array
    {
        return [
            'user'                => UserFixture::class,
            'organization'        => OrganizationFixture::class,
            'organization_member' => OrganizationMemberFixture::class,
            'project'             => ProjectFixture::class,
            'project_member'      => ProjectMemberFixture::class,
            'label'               => LabelFixture::class,
            'issue'               => IssueFixture::class,
            'comment'             => CommentFixture::class,
        ];
    }

    protected function _before(): void
    {
        $this->jwtConfig = Yii::$app->get('jwt');
        $this->tester->haveServerParameter('REMOTE_ADDR', '127.0.0.1');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function loginAs(string $id, UserRole $role, string $email): void
    {
        $jwt = $this->createAccessToken($id, $role, $email)->toString();
        $this->tester->haveHttpHeader('Authorization', 'Bearer ' . $jwt);
    }

    private function grabJson(): array
    {
        return json_decode($this->tester->grabPageSource(), true);
    }

    private function commentUrl(string $suffix = ''): string
    {
        return '/' . self::ORG_SLUG . '/' . self::PROJECT_KEY . '/' . self::ISSUE_ID . '/comment' . $suffix;
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->commentUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    public function testViewReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org>/<project>/<issue>/comment
    // =========================================================================

    public function testIndexReturnsCursorPaginatedComments(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl());

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();

        $hasMore = $this->tester->grabHttpHeader('X-Has-More');
        $nextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->assertTrue($json['success']);
        $this->assertSame($hasMore, 'false'); // Only 2 comments in fixture, so no more pages
        $this->assertNotNull($nextCursor);
        $this->assertArrayHasKey('data', $json);
    }

    public function testIndexReturnsCursorPaginatedCommentsWithPageSizeParam(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl() . '?pageSize=1');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();

        $hasMore = $this->tester->grabHttpHeader('X-Has-More');
        $nextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->assertTrue($json['success']);
        $this->assertSame($hasMore, 'true'); // Only 2 comments in fixture, so more pages available
        $this->assertNotNull($nextCursor);
        $this->assertArrayHasKey('data', $json);
    }

    // =========================================================================
    // VIEW  GET /<org>/<project>/<issue>/comment/<id>
    // =========================================================================

    public function testViewReturnsComment(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::COMMENT_ID_1, $json['data']['id']);
    }

    public function testViewReturns404ForNonExistentComment(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl('/01900000-0000-0005-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // CREATE  POST /<org>/<project>/<issue>/comment
    // =========================================================================

    public function testCreateCommentSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->commentUrl(), [
            'content'  => 'A new comment from tests',
            'issue_id' => self::ISSUE_ID,
        ]);

        $this->tester->seeResponseCodeIs(201);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('A new comment from tests', $json['data']['content']);
    }

    public function testCreateCommentReturnsValidationErrorForEmptyContent(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->commentUrl(), [
            'issue_id' => self::ISSUE_ID,
        ]);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/<project>/<issue>/comment/<id>
    // =========================================================================

    public function testUpdateOwnCommentSucceeds(): void
    {
        // Comment 2 belongs to OWNER
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->commentUrl('/' . self::COMMENT_ID_2), [
            'content' => 'Updated by owner',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Updated by owner', $json['data']['content']);
    }

    public function testUpdateReturns404ForNonExistentComment(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->commentUrl('/01900000-0000-0005-0000-999999999999'), [
            'content' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/<project>/<issue>/comment/<id>
    // =========================================================================

    public function testDeleteOwnCommentSucceeds(): void
    {
        // Comment 2 belongs to OWNER
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->commentUrl('/' . self::COMMENT_ID_2));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturns404ForNonExistentComment(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->commentUrl('/01900000-0000-0005-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // Permission: outsider cannot view comments
    // =========================================================================

    public function testOutsiderCannotViewComment(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));

        $this->tester->seeResponseCodeIs(403);
    }

    // =========================================================================
    // findModel requires organization_id, project_id, and issue_id
    // =========================================================================

    public function testViewWithMissingOrganizationIdReturnsError(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Using a malformed URL without org slug — should fail routing or return 404
        $this->tester->sendAjaxGetRequest('/comment/' . self::COMMENT_ID_1);

        // strict parsing should result in 404 (no matching route)
        $this->tester->seeResponseCodeIs(404);
    }
}
