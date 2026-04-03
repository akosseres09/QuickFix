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

class ProjectControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_ID            = '01900000-0000-7001-8000-000000000001';
    private const ORG_SLUG          = 'test-org';
    private const SECOND_ORG_ID     = '01900000-0000-7001-8000-000000000002';

    private const PROJECT_ID        = '01900000-0000-7002-8000-000000000001';
    private const PROJECT_KEY       = 'TEST';
    private const PRIVATE_PROJECT_ID = '01900000-0000-7002-8000-000000000002';
    private const PRIVATE_PROJECT_KEY = 'PRIV';

    private const OWNER_ID          = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL       = 'nicole.paucek@schultz.info';
    private const MEMBER_ID    = '01900000-0000-7000-8000-000000000007';
    private const MEMBER_EMAIL = 'active.member@example.com';
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

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project');
        $this->tester->seeResponseCodeIs(401);
    }

    public function testViewReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY);
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org_slug>/project
    // =========================================================================

    public function testIndexReturnsPaginatedProjects(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('_meta', $json);
    }

    public function testIndexWithOrgIdInsteadOfSlug(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testIndexReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project');

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view projects in this organization.', $json['error']['message']);
    }

    // =========================================================================
    // VIEW  GET /<org>/<project_key|id>
    // =========================================================================

    public function testViewByProjectKeyReturnsProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::PROJECT_ID, $json['data']['id']);
    }

    public function testViewByProjectIdReturnsProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_ID);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::PROJECT_ID, $json['data']['id']);
    }

    public function testViewReturns404ForNonExistentProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/NON-EXISTENT');

        $this->tester->seeResponseCodeIs(404);
    }

    public function testViewReturns403WhenThereIsNoPermission(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PRIVATE_PROJECT_KEY);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->tester->assertStringContainsString('You do not have permission to access this project.', $json['error']['message']);
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // CREATE  POST /<org>/project
    // =========================================================================

    public function testCreateProjectSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/' . self::ORG_SLUG . '/project', [
            'name'            => 'New Test Project',
            'key'             => 'NTP',
            'description'     => 'A project created in tests',
            'organization_id' => self::ORG_ID,
            'owner_id'        => self::OWNER_ID,
        ]);

        $this->tester->seeResponseCodeIs(201);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('New Test Project', $json['data']['name']);
    }

    public function testCreateProjectReturnsValidationErrorForMissingFields(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/' . self::ORG_SLUG . '/project', []);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testCreateProjectReturns403WhenThereIsNoPermission(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest('/' . self::ORG_SLUG . '/project', [
            'name'            => 'New Test Project',
            'key'             => 'NTP',
            'description'     => 'A project created in tests',
            'organization_id' => self::ORG_ID,
            'owner_id'        => self::OWNER_ID,
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->tester->assertStringContainsString('You do not have permission to create a project in this organization.', $json['error']['message']);
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/project/<key>
    // =========================================================================

    public function testUpdateProjectSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY, [
            'name' => 'Updated Project Name',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Updated Project Name', $json['data']['name']);
    }

    public function testUpdateReturns404ForNonExistentProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/' . self::ORG_SLUG . '/project/NOPE', [
            'name' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }


    public function testUpdateReturns403WhenThereIsNoPermission(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/' . self::ORG_SLUG . '/project/' . self::PRIVATE_PROJECT_KEY, [
            'name' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->tester->assertStringContainsString('You do not have permission to update this project.', $json['error']['message']);
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/project/<key>
    // =========================================================================

    public function testDeleteProjectSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY);

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturns404ForNonExistentProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/' . self::ORG_SLUG . '/project/NOPE');

        $this->tester->seeResponseCodeIs(404);
    }

    public function testDeleteReturns403WhenThereIsNoPermission(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/' . self::ORG_SLUG . '/project/' . self::PRIVATE_PROJECT_KEY);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->tester->assertStringContainsString('You do not have permission to delete this project.', $json['error']['message']);
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // Project key translator: works with both key and UUID
    // =========================================================================

    public function testProjectKeyTranslatorResolvesKeyToId(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        // Via key
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY);
        $this->tester->seeResponseCodeIs(200);
        $byKey = $this->grabJson();

        // Via UUID
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_ID);
        $this->tester->seeResponseCodeIs(200);
        $byId = $this->grabJson();

        $this->assertEquals($byKey['data']['id'], $byId['data']['id']);
    }

    // =========================================================================
    // Org slug + project key combo works
    // =========================================================================

    public function testBothTranslatorsWorkInCombination(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        // slug + key
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_KEY);
        $this->tester->seeResponseCodeIs(200);

        // uuid + key
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project/' . self::PROJECT_KEY);
        $this->tester->seeResponseCodeIs(200);

        // slug + uuid
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/project/' . self::PROJECT_ID);
        $this->tester->seeResponseCodeIs(200);

        // uuid + uuid
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project/' . self::PROJECT_ID);
        $this->tester->seeResponseCodeIs(200);
    }

    // =========================================================================
    // FindModel
    // =========================================================================

    public function testFindModelReturnsNotFoundWhenOrganizationIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project/' . self::PROJECT_ID);

            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenProjectIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['id']);
            $request->setQueryParams($params);
        });


        try {
            $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project/' . self::PROJECT_ID);
            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project ID is required', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenProjectDoesNotExist(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function () {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            $params['id'] = '01900000-0000-7002-8000-000000000099';
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/project/' . self::PROJECT_ID);
            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project not found!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }
}
