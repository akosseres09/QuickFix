<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\UserRole;
use Yii;
use yii\base\Application;
use yii\base\Event;

class ProjectMemberControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG          = 'test-org';
    private const ORG_ID            = '01900000-0000-7001-8000-000000000001';
    private const PROJECT_KEY       = 'TEST';
    private const PROJECT_ID        = '01900000-0000-7002-8000-000000000001';

    private const PM_ID_OWNER       = '01900000-0000-7008-8000-000000000001';
    private const PM_ID_MEMBER      = '01900000-0000-7008-8000-000000000006';

    private const OWNER_ID          = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL       = 'nicole.paucek@schultz.info';
    private const MEMBER_ID         = '01900000-0000-7000-8000-000000000007';
    private const OUTSIDER_ID       = '01900000-0000-7000-8000-000000000005';
    private const OUTSIDER_EMAIL    = 'not.part.of.any.organization@example.com';

    // ── Fixtures ─────────────────────────────────────────────────────────────

    public function _fixtures(): array
    {
        return [
            'user'                => UserFixture::class,
            'organization'        => OrganizationFixture::class,
            'organization_member' => OrganizationMemberFixture::class,
            'project'             => ProjectFixture::class,
            'project_member'      => ProjectMemberFixture::class,
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

    private function memberUrl(string $suffix = ''): string
    {
        return '/' . self::ORG_SLUG . '/' . self::PROJECT_KEY . '/member' . $suffix;
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->memberUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org>/<project>/member
    // =========================================================================

    public function testIndexReturnsCursorPaginatedProjectMembers(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl());

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);

        $hasMore = $this->tester->grabHttpHeader('X-Has-More');
        $nextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->assertEquals('false', $hasMore);
        $this->assertNotNull($nextCursor);
        $nextCursorInResponse = end($json['data'])['id'] ?? null;
        $this->assertEquals($nextCursor, $nextCursorInResponse);
    }

    public function testIndexReturnsProjectMembersOnPagination(): void
    {
        $pageSize = 2;
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl(), ['pageSize' => $pageSize]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);

        $firstHasMore = $this->tester->grabHttpHeader('X-Has-More');
        $firstNextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->assertEquals('true', $firstHasMore);
        $this->assertNotNull($firstNextCursor);
        $nextCursorInResponse = end($json['data'])['id'] ?? null;
        $this->assertEquals($firstNextCursor, $nextCursorInResponse);

        $this->tester->sendAjaxGetRequest($this->memberUrl(), ['pageSize' => $pageSize, 'cursor' => $firstNextCursor]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);

        $secondHasMore = $this->tester->grabHttpHeader('X-Has-More');
        $secondNextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->assertEquals('false', $secondHasMore);
        $this->assertNotNull($secondNextCursor);

        $nextCursorInResponse = end($json['data'])['id'] ?? null;
        $this->assertEquals($secondNextCursor, $nextCursorInResponse);
    }

    // =========================================================================
    // VIEW  GET /<org>/<project>/member/<id>
    // =========================================================================

    public function testViewReturnsMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/' . self::PM_ID_OWNER));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::PM_ID_OWNER, $json['data']['id']);
    }

    public function testViewReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/01900000-0000-0008-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/<project>/member/<id>
    // =========================================================================

    public function testUpdateProjectMemberSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/' . self::PM_ID_MEMBER), [
            'role' => 'admin',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testUpdateReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/01900000-0000-0008-0000-999999999999'), [
            'role' => 'member',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/<project>/member/<id>
    // =========================================================================

    public function testDeleteProjectMemberSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/' . self::PM_ID_MEMBER));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/01900000-0000-0008-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // findModel requires organization_id and project_id
    // =========================================================================

    public function testViewWithNonExistentProjectReturnsNotFound(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/NON-EXISTENT/member/' . self::PM_ID_OWNER);

        $this->tester->seeResponseCodeIs(404);
    }

    public function testFindModelReturnsBadRequestWhenOrganizationIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_KEY . '/member/' . self::PM_ID_OWNER);

        try {
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsBadRequestWhenProjectIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['project_id']);
            $request->setQueryParams($params);
        });

        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_KEY . '/member/' . self::PM_ID_OWNER);

        try {
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project ID is required', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenProjectIsNotFound(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            $params['project_id'] = '01900000-0000-7002-8000-000000000999'; // Non-existent project ID
            $request->setQueryParams($params);
        });

        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_KEY . '/member/' . self::PM_ID_OWNER);

        try {
            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project does not exist in the specified organization.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    // =========================================================================
    // Translators: slug + key works
    // =========================================================================

    public function testIndexWithUuidParams(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_ID . '/member');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    // =========================================================================
    // CheckAccess
    // =========================================================================

    public function testCheckAccessReturnsBadRequestWhenProjectIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['project_id']);
            $request->setQueryParams($params);
        });

        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_KEY . '/member');

        try {
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project ID is required', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testCheckAccessReturnsForbiddenWhenUserLacksPermissionForIndexAndView(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl());

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view project members', $json['error']['message']);
    }

    public function testCheckAccessReturnsForbiddenWhenUserLacksPermissionForCreateUpdateDelete(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/' . self::PM_ID_MEMBER), [
            'role' => 'admin',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage project members', $json['error']['message']);
    }
}
