<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Label;
use common\models\UserRole;
use Yii;
use yii\base\Application;
use yii\base\Event;

class LabelControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG      = 'test-org';
    private const ORG_ID        = '01900000-0000-7001-8000-000000000001';
    private const PROJECT_KEY   = 'TEST';
    private const PROJECT_ID    = '01900000-0000-7002-8000-000000000001';

    // Labels belonging to PROJECT_ID
    private const LABEL_IN_PROGRESS = '01900000-0000-7003-8000-000000000003';
    private const LABEL_NEEDS_REVIEW = '01900000-0000-7003-8000-000000000004';
    private const LABEL_BLOCKED     = '01900000-0000-7003-8000-000000000005';

    private const OWNER_ID      = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL   = 'nicole.paucek@schultz.info';
    private const OUTSIDER_ID   = '01900000-0000-7000-8000-000000000005';
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

    private function labelUrl(string $suffix = ''): string
    {
        return '/' . self::ORG_SLUG . '/' . self::PROJECT_KEY . '/label' . $suffix;
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturnsUnauthorizedWithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->labelUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org>/<project>/label
    // =========================================================================

    public function testIndexReturnsPaginatedLabels(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->labelUrl());

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayNotHasKey('_meta', $json);
    }

    public function testIndexReturnsBadRequestWhenProjectIdIsMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['project_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxGetRequest($this->labelUrl());

            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project ID is required.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    // =========================================================================
    // CREATE  POST /<org>/<project>/label
    // =========================================================================

    public function testCreateLabelSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl(), [
            'name'        => 'Testing',
            'description' => 'For testing',
            'color'       => '#abcdef',
            'project_id'  => self::PROJECT_ID,
        ]);

        $this->tester->seeResponseCodeIs(201);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Testing', $json['data']['name']);
    }

    public function testCreateLabelReturnsValidationErrorForMissingName(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl(), [
            'color'      => '#abcdef',
            'project_id' => self::PROJECT_ID,
        ]);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/<project>/label/<id>
    // =========================================================================

    public function testUpdateLabelSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->labelUrl('/' . self::LABEL_IN_PROGRESS), [
            'name' => 'Working On It',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Working On It', $json['data']['name']);
    }

    public function testUpdateLabelReturnsNotFoundForNonExistent(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->labelUrl('/01900000-0000-0003-0000-999999999999'), [
            'name' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/<project>/label/<id>
    // =========================================================================

    public function testDeleteLabelSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->labelUrl('/' . self::LABEL_BLOCKED));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteLabelReturnsNotFoundForNonExistent(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->labelUrl('/01900000-0000-0003-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // REORDER  POST /<org>/<project>/label/<id>/reorder
    // =========================================================================

    public function testReorderLabelSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), [
            'new_index' => 1,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testReorderLabelReturnsBadRequestForMissingIndex(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), []);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testReorderLabelReturnsBadRequestForInvalidIndex(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), [
            'new_index' => 0,
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testReorderLabelReturnsBadRequestForIndexTooHigh(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), [
            'new_index' => 31,
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testReorderLabelReturnsConflictWhenSaveFails(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // Attempt to reorder a label that belongs to a different project to trigger save failure

        Event::on(Label::class, Label::EVENT_BEFORE_UPDATE, function ($event) {
            $event->isValid = false; // Prevent the label from being saved to simulate a failure
        });

        try {
            $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), [
                'new_index' => 1,
            ]);

            $this->tester->seeResponseCodeIs(409);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Failed to reorder label.', $json['error']['message']);
        } finally {
            Event::off(Label::class, Label::EVENT_BEFORE_UPDATE); // Clean up the event handler
        }
    }

    public function testReorderLabelReturnsForbiddenForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl('/' . self::LABEL_IN_PROGRESS . '/reorder'), [
            'new_index' => 1,
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to manage labels in this project.', $json['error']['message']);
    }

    // =========================================================================
    // Permission checks: outsider cannot manage labels
    // =========================================================================

    public function testOutsiderCannotCreateLabel(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->labelUrl(), [
            'name'       => 'Unauthorized',
            'color'      => '#000000',
            'project_id' => self::PROJECT_ID,
        ]);

        $this->tester->seeResponseCodeIs(403);
    }

    public function testOutsiderCannotDeleteLabel(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->labelUrl('/' . self::LABEL_IN_PROGRESS));

        $this->tester->seeResponseCodeIs(403);
    }

    // =========================================================================
    // Translator filters: org slug + project key
    // =========================================================================

    public function testLabelIndexWithUuidParams(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_ID . '/label');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    // =========================================================================
    // FindModel
    // =========================================================================

    public function testFindModelReturnsBadRequestWhenOrganizationIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['organization_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxRequest(
                'PUT',
                '/' . self::ORG_ID . '/' . self::PROJECT_ID . '/label/' . self::LABEL_IN_PROGRESS,
                []
            );

            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Organization ID is required.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsBadRequestWhenProjectIdMissing(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            unset($params['project_id']);
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxRequest(
                'PUT',
                '/' . self::ORG_ID . '/' . self::PROJECT_ID . '/label/' . self::LABEL_IN_PROGRESS,
                []
            );

            $this->tester->seeResponseCodeIs(400);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Project ID is required.', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenProjectDoesNotExist(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        Event::on(Application::class, Application::EVENT_BEFORE_ACTION, function ($event) {
            $request = Yii::$app->getRequest();

            $params = $request->getQueryParams();
            $params['project_id'] = '01900000-0000-7002-8000-999999999999'; // Non-existent project ID
            $request->setQueryParams($params);
        });

        try {
            $this->tester->sendAjaxRequest(
                'PUT',
                '/' . self::ORG_ID . '/' . self::PROJECT_ID . '/label/01900000-0000-0003-0000-999999999999',
                []
            );
            $this->tester->seeResponseCodeIs(404);
            $json = $this->grabJson();
            $this->assertFalse($json['success']);
            $this->assertStringContainsString('Requested project not found!', $json['error']['message']);
        } finally {
            Event::off(Application::class, Application::EVENT_BEFORE_ACTION);
        }
    }

    public function testFindModelReturnsNotFoundWhenLabelIsNotFound(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest(
            'PUT',
            '/' . self::ORG_ID . '/' . self::PROJECT_ID . '/label/01900000-0000-0003-0000-999999999999',
            []
        );

        $this->tester->seeResponseCodeIs(404);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('The requested label does not exist.', $json['error']['message']);
    }
}
