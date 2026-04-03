<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\IssueFixture;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\UserFixture;
use common\models\Issue;
use common\models\UserRole;
use Yii;
use yii\base\Event;

class IssueControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG     = 'test-org';
    private const ORG_ID       = '01900000-0000-7001-8000-000000000001';
    private const PROJECT_KEY  = 'TEST';
    private const PROJECT_ID   = '01900000-0000-7002-8000-000000000001';

    private const ISSUE_ID_1   = '01900000-0000-7004-8000-000000000001'; // open
    private const ISSUE_ID_2   = '01900000-0000-7004-8000-000000000002'; // closed, draft
    private const ISSUE_ID_3   = '01900000-0000-7004-8000-000000000003'; // archived

    private const LABEL_OPEN_ID      = '01900000-0000-7003-8000-000000000001';
    private const LABEL_CLOSED_ID    = '01900000-0000-7003-8000-000000000002';
    private const LABEL_IN_PROGRESS  = '01900000-0000-7003-8000-000000000003';

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

    private function issueUrl(string $suffix = ''): string
    {
        return '/' . self::ORG_SLUG . '/' . self::PROJECT_KEY . '/issue' . $suffix;
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->issueUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    public function testViewReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->issueUrl('/' . self::ISSUE_ID_1));
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org>/<project>/issue
    // =========================================================================

    public function testIndexReturnsPaginatedIssues(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl());

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('_meta', $json);
    }

    public function testIndexWithUuidParams(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_ID . '/issue');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    // =========================================================================
    // VIEW  GET /<org>/<project>/issue/<id>
    // =========================================================================

    public function testViewReturnsIssue(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl('/' . self::ISSUE_ID_1));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::ISSUE_ID_1, $json['data']['id']);
    }

    public function testViewReturns404ForNonExistentIssue(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl('/01900000-0000-0004-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // CREATE  POST /<org>/<project>/issue
    // =========================================================================

    public function testCreateIssueSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl(), [
            'title'        => 'New issue created in test',
            'description'  => 'A detailed description',
            'status_label' => self::LABEL_OPEN_ID,
            'project_id'   => self::PROJECT_ID,
        ]);

        $json = $this->grabJson();

        $this->tester->seeResponseCodeIs(201);
        $this->assertTrue($json['success']);
        $this->assertEquals('New issue created in test', $json['data']['title']);
        $this->assertEquals(Issue::TYPE_TASK, $json['data']['type']);
        $this->assertEquals(Issue::PRIORITY_MEDIUM, $json['data']['priority']);
    }

    public function testCreateIssueReturnsValidationErrorForMissingTitle(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl(), [
            'description' => 'Missing title',
            'project_id'  => self::PROJECT_ID,
        ]);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/<project>/issue/<id>
    // =========================================================================

    public function testUpdateIssueSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->issueUrl('/' . self::ISSUE_ID_1), [
            'title' => 'Updated issue title',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals('Updated issue title', $json['data']['title']);
    }

    public function testUpdateReturns404ForNonExistentIssue(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->issueUrl('/01900000-0000-0004-0000-999999999999'), [
            'title' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/<project>/issue/<id>
    // =========================================================================

    public function testDeleteIssueSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->issueUrl('/' . self::ISSUE_ID_1));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturns404ForNonExistentIssue(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->issueUrl('/01900000-0000-0004-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // CLOSE  POST /<org>/<project>/issue/<id>/close
    // =========================================================================

    public function testCloseIssueSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl('/' . self::ISSUE_ID_1 . '/close'), []);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testCloseReturns404ForNonExistentIssue(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl('/01900000-0000-0004-0000-999999999999/close'), []);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // OPEN  POST /<org>/<project>/issue/<id>/open
    // =========================================================================

    public function testOpenIssueSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        // First close it so we can reopen
        $this->tester->sendAjaxPostRequest($this->issueUrl('/' . self::ISSUE_ID_1 . '/close'), []);
        $this->tester->seeResponseCodeIs(200);

        $this->tester->sendAjaxPostRequest($this->issueUrl('/' . self::ISSUE_ID_1 . '/open'), []);
        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    // =========================================================================
    // STATS  GET /<org>/<project>/issue/stats
    // =========================================================================

    public function testStatsReturnsIssueStatistics(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl('/stats'));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('statuses', $json['data']);
        $this->assertArrayHasKey('totals', $json['data']);
        $this->assertArrayHasKey('priorities', $json['data']);
        $this->assertArrayHasKey('types', $json['data']);
        $this->assertArrayHasKey('activity', $json['data']);
        $this->assertArrayHasKey('trend', $json['data']);
    }

    public function testStatsReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->issueUrl('/stats'));
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // Permission checks: outsider cannot access issues
    // =========================================================================

    public function testViewIssueReturnsForbiddenForUnauthorizedUser(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl('/' . self::ISSUE_ID_1));

        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testIndexReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->issueUrl());

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to view issues in this project.', $json['error']['message']);
    }

    public function testCreateReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl(), [
            'title'        => 'Unauthorized issue',
            'status_label' => self::LABEL_OPEN_ID,
            'project_id'   => self::PROJECT_ID,
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to create issues in this project.', $json['error']['message']);
    }

    public function testUpdateReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->issueUrl('/' . self::ISSUE_ID_1), [
            'title' => 'Unauthorized update',
        ]);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testDeleteReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->issueUrl('/' . self::ISSUE_ID_1));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testCloseReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl('/' . self::ISSUE_ID_1 . '/close'), []);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to close this issue.', $json['error']['message']);
    }

    public function testOpenReturns403ForOutsider(): void
    {
        $this->loginAs(self::OUTSIDER_ID, UserRole::USER, self::OUTSIDER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->issueUrl('/' . self::ISSUE_ID_1 . '/open'), []);

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
        $this->assertStringContainsString('You do not have permission to open this issue.', $json['error']['message']);
    }

    public function testDeleteReturns403ForMember(): void
    {
        $this->loginAs(self::MEMBER_ID, UserRole::USER, self::MEMBER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->issueUrl('/' . self::ISSUE_ID_1));

        $this->tester->seeResponseCodeIs(403);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // Translator filters: org slug + project key work together
    // =========================================================================

    public function testOrgSlugAndProjectKeyTranslation(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);

        // slug + key
        $this->tester->sendAjaxGetRequest('/' . self::ORG_SLUG . '/' . self::PROJECT_KEY . '/issue/' . self::ISSUE_ID_1);
        $this->tester->seeResponseCodeIs(200);

        // uuid + uuid
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/' . self::PROJECT_ID . '/issue/' . self::ISSUE_ID_1);
        $this->tester->seeResponseCodeIs(200);
    }
}
