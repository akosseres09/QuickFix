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
use yii\base\Application;
use yii\base\Event;

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
    private const MEMBER_ID    = '01900000-0000-7000-8000-000000000007';
    private const MEMBER_EMAIL = 'active.member@example.com';
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

    public function testIndexReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->commentUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    public function testViewReturnsUnauthorizedWithoutAuth(): void
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

    public function testViewReturnsNotFoundForNonExistentComment(): void
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

    public function testUpdateReturnsNotFoundForNonExistentComment(): void
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

    public function testDeleteReturnsNotFoundForNonExistentComment(): void
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

    public function testIndexReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->commentUrl());

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view comments.', $json['error']['message']);
    }

    public function testCreateReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->commentUrl(), [
            'content'  => 'Unauthorized comment',
            'issue_id' => self::ISSUE_ID,
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to create comments.', $json['error']['message']);
    }

    public function testUpdateReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->commentUrl('/' . self::COMMENT_ID_1), [
            'content' => 'Unauthorized update',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testDeleteReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->commentUrl('/' . self::COMMENT_ID_1));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testMemberCanUpdateOwnComment(): void
    {
        // Comment 1 belongs to MEMBER
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->commentUrl('/' . self::COMMENT_ID_1), [
            'content' => 'Updated by member',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Updated by member', $json['data']['content']);
    }

    public function testMemberCanDeleteOwnComment(): void
    {
        // Comment 1 belongs to MEMBER
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->commentUrl('/' . self::COMMENT_ID_1));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testOwnerCanDeleteAnyComment(): void
    {
        // Comment 1 belongs to MEMBER, but OWNER has COMMENT_DELETE_ANY
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->commentUrl('/' . self::COMMENT_ID_1));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testOwnerCanUpdateAnyComment(): void
    {
        // Comment 1 belongs to MEMBER, but OWNER has COMMENT_UPDATE_ANY
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->commentUrl('/' . self::COMMENT_ID_1), [
            'content' => 'Updated by owner on member comment',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
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

    public function testFindModelReturnsNotFoundWhenOrganizationIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Attempt to access comment with missing org slug in URL
        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->request;

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));
            $json = $this->grabJson();
            $this->tester->seeResponseCodeIs(400);
            $this->tester->assertStringContainsString('Organization ID is required to access comments.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenProjectIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Attempt to access comment with missing project slug in URL
        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->request;

            $params = $request->getQueryParams();
            unset($params['project_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));
            $json = $this->grabJson();
            $this->tester->seeResponseCodeIs(400);
            $this->tester->assertStringContainsString('Project ID is required to access comments.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenIssueIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Attempt to access comment with missing issue slug in URL
        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->request;

            $params = $request->getQueryParams();
            unset($params['issue_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));
            $json = $this->grabJson();
            $this->tester->seeResponseCodeIs(400);
            $this->tester->assertStringContainsString('Issue ID is required to access comments.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenCommentIsNotFound(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Attempt to access comment with missing issue slug in URL
        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->request;

            $params = $request->getQueryParams();
            $params['project_id'] = '01900000-0000-7001-8000-000000000099'; // Invalid project ID in the organization
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest($this->commentUrl('/' . self::COMMENT_ID_1));
            $json = $this->grabJson();
            $this->tester->seeResponseCodeIs(404);
            $this->tester->assertStringContainsString('The requested project does not exist!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }
}
