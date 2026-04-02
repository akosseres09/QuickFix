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
use common\fixtures\WorktimeFixture;
use common\models\UserRole;
use Yii;

class WorktimeControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const ORG_SLUG      = 'test-org';
    private const ORG_ID        = '01900000-0000-7001-8000-000000000001';
    private const PROJECT_ID    = '01900000-0000-7002-8000-000000000001';
    private const PROJECT_KEY   = 'TEST';

    private const WORKTIME_ID_1 = '01900000-0000-7006-8000-000000000001';
    private const WORKTIME_ID_2 = '01900000-0000-7006-8000-000000000002';
    private const ISSUE_ID_1    = '01900000-0000-7004-8000-000000000001';

    private const OWNER_ID      = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL   = 'nicole.paucek@schultz.info';

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
            'worktime'            => WorktimeFixture::class,
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

    private function worktimeUrl(string $suffix = ''): string
    {
        return '/' . self::ORG_SLUG . '/worktime' . $suffix;
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testIndexReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->worktimeUrl());
        $this->tester->seeResponseCodeIs(401);
    }

    public function testStatsReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats'));
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // INDEX  GET /<org>/worktime
    // =========================================================================

    public function testIndexReturnsPaginatedWorktime(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl());

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('_meta', $json);
    }

    // =========================================================================
    // CREATE  POST /<org>/worktime
    // =========================================================================

    public function testCreateWorktimeSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->worktimeUrl(), [
            'issue_id'      => self::ISSUE_ID_1,
            'minutes_spent' => 60,
            'description'   => 'Worked on feature',
            'logged_at'     => '2024-03-01',
        ]);

        $this->tester->seeResponseCodeIs(201);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testCreateWorktimeReturnsValidationError(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest($this->worktimeUrl(), []);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    // =========================================================================
    // UPDATE  PUT /<org>/worktime/<id>
    // =========================================================================

    public function testUpdateWorktimeSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->worktimeUrl('/' . self::WORKTIME_ID_1), [
            'minutes_spent' => 120,
            'description'   => 'Updated description',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testUpdateReturns404ForNonExistentWorktime(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', $this->worktimeUrl('/01900000-0000-0006-0000-999999999999'), [
            'minutes_spent' => 30,
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /<org>/worktime/<id>
    // =========================================================================

    public function testDeleteWorktimeSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->worktimeUrl('/' . self::WORKTIME_ID_1));

        $this->tester->seeResponseCodeIs(204);
    }

    public function testDeleteReturns404ForNonExistentWorktime(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', $this->worktimeUrl('/01900000-0000-0006-0000-999999999999'));

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // STATS  GET /<org>/worktime/stats
    // =========================================================================

    public function testStatsReturnsWorktimeStatistics(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats'));

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('totalHours', $json['data']);
        $this->assertArrayHasKey('totalEntries', $json['data']);
        $this->assertArrayHasKey('avgHoursPerDay', $json['data']);
        $this->assertArrayHasKey('hoursPerDay', $json['data']);
        $this->assertArrayHasKey('hoursPerUser', $json['data']);
    }

    public function testStatsWithProjectFilter(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats') . '?project_id=' . self::PROJECT_KEY);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testStatsWithDateFilters(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats') . '?start_date=2024-01-01&end_date=2024-12-31');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testStatsReturns400ForInvalidDateFormat(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats') . '?start_date=not-a-date');

        $this->tester->seeResponseCodeIs(400);
    }

    public function testStatsReturns404ForNonExistentProject(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest($this->worktimeUrl('/stats') . '?project_id=01900000-0000-0002-0000-999999999999');

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // Org slug translator works for worktime
    // =========================================================================

    public function testIndexWithOrgUuid(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/' . self::ORG_ID . '/worktime');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }
}
