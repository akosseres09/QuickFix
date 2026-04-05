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

class OrganizationControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture IDs ──────────────────────────────────────────────────────────
    private const ORG_ID          = '01900000-0000-7001-8000-000000000001';
    private const ORG_SLUG        = 'test-org';
    private const SECOND_ORG_ID   = '01900000-0000-7002-8000-000000000002';
    private const SECOND_ORG_SLUG = 'second-org';

    // Users
    private const OWNER_ID        = '01900000-0000-7000-8000-000000000001'; // owner of ORG
    private const OWNER_EMAIL     = 'nicole.paucek@schultz.info';
    private const ADMIN_ID        = '01900000-0000-7000-8000-000000000003'; // admin in ORG
    private const ADMIN_EMAIL     = 'admin@example.com';
    private const MEMBER_ID    = '01900000-0000-7000-8000-000000000007';
    private const MEMBER_EMAIL = 'active.member@example.com';
    private const OUTSIDER_ID     = '01900000-0000-7000-8000-000000000005'; // not in any org
    private const OUTSIDER_EMAIL  = 'not.part.of.any.organization@example.com';

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

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest('/organization');
        $this->tester->seeResponseCodeIs(401);
    }

    public function testViewReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_SLUG);
        $this->tester->seeResponseCodeIs(401);
    }

    public function testCreateReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxPostRequest('/organization', ['name' => 'Test']);
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /organization
    // =========================================================================

    public function testIndexReturnsPaginatedListForAuthenticatedUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/organization');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('_meta', $json);
        $this->assertArrayHasKey('totalCount', $json['_meta']);
        $this->assertArrayHasKey('pageCount', $json['_meta']);
        $this->assertArrayHasKey('currentPage', $json['_meta']);
        $this->assertArrayHasKey('perPage', $json['_meta']);
    }

    // =========================================================================
    // VIEW  GET /organization/<slug|id>
    // =========================================================================

    public function testViewBySlugReturnsOrganization(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::ORG_ID, $json['data']['id']);
    }

    public function testViewByIdReturnsOrganization(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_ID);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::ORG_ID, $json['data']['id']);
    }

    public function testViewReturnsNotFoundForNonExistentSlug(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/organization/non-existent-slug');

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // CREATE  POST /organization
    // =========================================================================

    public function testCreateOrganizationSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/organization', [
            'name'        => 'Brand New Org',
            'slug'        => 'brand-new-org',
            'description' => 'Created in test',
        ]);

        $this->tester->seeResponseCodeIs(201);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Brand New Org', $json['data']['name']);
    }

    public function testCreateOrganizationReturnsValidationErrorForMissingName(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/organization', [
            'slug' => 'no-name-org',
        ]);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testCreateOrganizationReturnsValidationErrorForDuplicateSlug(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/organization', [
            'name' => 'Dup Org',
            'slug' => self::ORG_SLUG, // already taken
        ]);

        $this->tester->seeResponseCodeIs(422);
    }

    // =========================================================================
    // UPDATE  PUT /organization/<slug>
    // =========================================================================

    public function testUpdateOrganizationSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/organization/' . self::ORG_SLUG, [
            'name' => 'Updated Organization Name',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Updated Organization Name', $json['data']['name']);
    }

    public function testUpdateReturnsNotFoundForNonExistentOrg(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/organization/non-existent-org', [
            'name' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /organization/<slug>
    // =========================================================================

    public function testDeleteOrganizationSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturnsNotFoundForNonExistentOrg(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/organization/non-existent-org');

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // Slug translator filter: accepts both slug and UUID in URL
    // =========================================================================

    public function testSlugTranslatorWorksForViewAction(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        // By slug
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_SLUG);
        $this->tester->seeResponseCodeIs(200);
        $slugJson = $this->grabJson();

        // By UUID
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_ID);
        $this->tester->seeResponseCodeIs(200);
        $idJson = $this->grabJson();

        $this->assertEquals($slugJson['data']['id'], $idJson['data']['id']);
    }

    // =========================================================================
    // Permission checks: checkAccess
    // =========================================================================

    public function testViewReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view this organization.', $json['error']['message']);
    }

    public function testUpdateReturnsForbiddenForMember(): void
    {
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/organization/' . self::ORG_SLUG, [
            'name' => 'Unauthorized Update',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to update this organization.', $json['error']['message']);
    }

    public function testUpdateReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/organization/' . self::ORG_SLUG, [
            'name' => 'Unauthorized Update',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to update this organization.', $json['error']['message']);
    }

    public function testDeleteReturnsForbiddenForMember(): void
    {
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to delete this organization.', $json['error']['message']);
    }

    public function testDeleteReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to delete this organization.', $json['error']['message']);
    }

    public function testUpdateSucceedsForAdmin(): void
    {
        $this->loginAs(self::ADMIN_ID, UserRole::USER, self::ADMIN_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/organization/' . self::ORG_SLUG, [
            'name' => 'Admin Updated Name',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testDeleteReturnsForbiddenForAdmin(): void
    {
        $this->loginAs(self::ADMIN_ID, UserRole::USER, self::ADMIN_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/organization/' . self::ORG_SLUG);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to delete this organization.', $json['error']['message']);
    }

    public function testFindModelReturnsBadRequestForMissingOrganizationId(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['id']); // Remove the 'id' parameter to simulate missing organization ID
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_SLUG);
            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundForNonExistentOrganization(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            $params['id'] = '01900000-0000-7001-8000-000000000099'; // Set to a non-existent organization ID
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/organization/' . self::ORG_ID);
            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('The requested organization is not found!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }
}
