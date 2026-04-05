<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\UserRole;
use Yii;
use yii\base\Application;
use yii\base\Event;

class OrganizationMemberControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG         = 'test-org';
    private const ORG_ID           = '01900000-0000-7001-8000-000000000001';

    private const ORG_MEMBER_ID_1  = '01900000-0000-7007-8000-000000000001'; // owner
    private const ORG_MEMBER_ID_2  = '01900000-0000-7007-8000-000000000002'; // member

    private const OWNER_ID         = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL      = 'nicole.paucek@schultz.info';
    private const OWNER_USERNAME   = 'bayer.hudson';
    private const MEMBER_ID    = '01900000-0000-7000-8000-000000000007';
    private const MEMBER_EMAIL = 'active.member@example.com';
    private const MEMBER_USERNAME  = 'active.member';
    private const OUTSIDER_ID      = '01900000-0000-7000-8000-000000000005';
    private const OUTSIDER_EMAIL   = 'not.part.of.any.organization@example.com';

    // ── Fixtures ─────────────────────────────────────────────────────────────

    public function _fixtures(): array
    {
        return [
            'user'                => UserFixture::class,
            'organization'        => OrganizationFixture::class,
            'organization_member' => OrganizationMemberFixture::class,
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
        return '/' . self::ORG_SLUG . '/member' . $suffix;
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
    // INDEX  GET /<org>/member
    // =========================================================================

    public function testIndexReturnsCursorPaginatedMembers(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl());


        $hasMore = $this->tester->grabHttpHeader('X-Has-More');
        $nextCursor = $this->tester->grabHttpHeader('X-Next-Cursor');

        $this->tester->seeResponseCodeIs(200);

        $json = $this->grabJson();

        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayNotHasKey('_meta', $json);

        $this->assertEquals('false', $hasMore);
        $this->assertNotNull($nextCursor);

        $nextCursorInResponse = end($json['data'])['id'] ?? null;
        $this->assertEquals($nextCursor, $nextCursorInResponse);
    }

    public function testIndexWithCursorReturnsNextPage(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $pageSize = 2;
        $this->tester->sendAjaxGetRequest($this->memberUrl(), ['pageSize' => (string)$pageSize]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();

        $firstCursor = $this->tester->grabHttpHeader('X-Next-Cursor');
        $firstHasMore = $this->tester->grabHttpHeader('X-Has-More');

        $this->assertEquals('true', $firstHasMore);
        $this->assertNotNull($firstCursor);
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertLessThanOrEqual($pageSize, count($json['data']));

        $this->tester->sendAjaxGetRequest($this->memberUrl(), ['cursor' => $firstCursor, 'pageSize' => (string)$pageSize]);
        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $secondCursor = $this->tester->grabHttpHeader('X-Next-Cursor');
        $secondHasMore = $this->tester->grabHttpHeader('X-Has-More');

        $this->assertEquals('false', $secondHasMore);
        $this->assertNotNull($secondCursor);
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertLessThanOrEqual($pageSize, count($json['data']));

        foreach ($json['data'] as $member) {
            $this->assertLessThanOrEqual($member['id'], $firstCursor);
        }
    }

    // =========================================================================
    // VIEW  GET /<org>/member/<id|username>
    // =========================================================================

    public function testViewByIdReturnsMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/' . self::ORG_MEMBER_ID_1));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::ORG_MEMBER_ID_1, $json['data']['id']);
    }

    public function testViewByUsernameReturnsMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/' . self::OWNER_USERNAME));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testViewReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/01900000-0000-0007-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    public function testViewReturnsNotFoundForNonExistentUsername(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/nonexistent.user'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/member/<id>
    // =========================================================================

    public function testUpdateMemberSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/' . self::ORG_MEMBER_ID_2), [
            'role' => 'admin',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testUpdateReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/01900000-0000-0007-0000-999999999999'), [
            'role' => 'member',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/member/<id>
    // =========================================================================

    public function testDeleteMemberSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/' . self::ORG_MEMBER_ID_2));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturnsNotFoundForNonExistentMember(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/01900000-0000-0007-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // Org slug translator: works with slug and UUID
    // =========================================================================

    public function testIndexWithOrgUuid(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/member');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    // =========================================================================
    // FindModel
    // =========================================================================

    public function testFindModelReturnsBadRequestWhenOrganizationIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/member/' . self::ORG_MEMBER_ID_1);
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    // =========================================================================
    // Permission checks: outsider cannot access org members
    // =========================================================================

    public function testIndexReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl());

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view organization members.', $json['error']['message']);
    }

    public function testViewReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->memberUrl('/' . self::ORG_MEMBER_ID_1));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view organization members.', $json['error']['message']);
    }

    public function testUpdateReturnsForbiddenForMember(): void
    {
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/' . self::ORG_MEMBER_ID_2), [
            'role' => 'admin',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage organization members.', $json['error']['message']);
    }

    public function testUpdateReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->memberUrl('/' . self::ORG_MEMBER_ID_2), [
            'role' => 'admin',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage organization members.', $json['error']['message']);
    }

    public function testDeleteReturnsForbiddenForMember(): void
    {
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/' . self::ORG_MEMBER_ID_2));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage organization members.', $json['error']['message']);
    }

    public function testDeleteReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->memberUrl('/' . self::ORG_MEMBER_ID_2));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage organization members.', $json['error']['message']);
    }

    public function testCheckAccessReturnsBadRequestOnIndexWhenOrganizationIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/member');
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }
}
