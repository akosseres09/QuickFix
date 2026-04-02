<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\UserFixture;
use common\models\UserRole;
use Yii;

class UserControllerTest extends Unit
{
    use AccessTokenHandler;

    protected FunctionalTester $tester;
    private $jwtConfig;

    // ── Fixture constants ────────────────────────────────────────────────────
    private const OWNER_ID      = '01900000-0000-7000-8000-000000000001';
    private const OWNER_EMAIL   = 'nicole.paucek@schultz.info';
    private const OWNER_USERNAME = 'bayer.hudson';

    private const MEMBER_ID     = '01900000-0000-7000-8000-000000000002';
    private const MEMBER_EMAIL  = 'jane.doe@example.com';
    private const MEMBER_USERNAME = 'jane.doe';

    private const ADMIN_ID      = '01900000-0000-7000-8000-000000000003';
    private const ADMIN_EMAIL   = 'admin@example.com';

    // ── Fixtures ─────────────────────────────────────────────────────────────

    public function _fixtures(): array
    {
        return [
            'user' => UserFixture::class,
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
        $this->tester->amBearerAuthenticated($jwt);
    }

    private function grabJson(): array
    {
        return json_decode($this->tester->grabPageSource(), true);
    }

    // =========================================================================
    // AUTH: 401 when no Bearer token
    // =========================================================================

    public function testViewReturns401WithoutAuth(): void
    {
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_ID);
        $this->tester->seeResponseCodeIs(401);
    }

    // =========================================================================
    // VIEW  GET /user/<id|email|username>
    // =========================================================================

    public function testViewByIdReturnsUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_ID);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::OWNER_ID, $json['data']['id']);
    }

    public function testViewByUsernameReturnsUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_USERNAME);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::OWNER_ID, $json['data']['id']);
    }

    public function testViewByEmailReturnsUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_EMAIL);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::OWNER_ID, $json['data']['id']);
    }

    public function testViewReturns404ForNonExistentUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/01900000-0000-0000-0000-999999999999');

        $this->tester->seeResponseCodeIs(404);
    }

    public function testViewReturns404ForNonExistentUsername(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/no-such-username');

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // VIEW returns serialized UserResource fields
    // =========================================================================

    public function testViewReturnsExpectedFields(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_ID);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $data = $json['data'];

        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('username', $data);
        $this->assertArrayHasKey('email', $data);
        $this->assertArrayHasKey('firstName', $data);
        $this->assertArrayHasKey('lastName', $data);
        $this->assertArrayHasKey('createdAt', $data);

        // Sensitive fields should NOT be exposed
        $this->assertArrayNotHasKey('password_hash', $data);
        $this->assertArrayNotHasKey('auth_key', $data);
        $this->assertArrayNotHasKey('password_reset_token', $data);
        $this->assertArrayNotHasKey('verification_token', $data);
    }

    // =========================================================================
    // UPDATE  PUT /user/<id>
    // =========================================================================

    public function testUpdateUserSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/user/' . self::OWNER_ID, [
            'first_name' => 'UpdatedFirstName',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testUpdateReturns404ForNonExistentUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('PUT', '/user/01900000-0000-0000-0000-999999999999', [
            'first_name' => 'X',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // =========================================================================
    // DELETE  DELETE /user/<id>
    // =========================================================================

    public function testDeleteUserSucceeds(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxRequest('DELETE', '/user/' . self::OWNER_ID);

        $this->tester->seeResponseCodeIs(204);
    }

    // =========================================================================
    // Upload Profile Picture  POST /user/<id>/upload-profile-picture
    // =========================================================================

    public function testUploadProfilePictureReturns400WithNoFile(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/user/' . self::OWNER_ID . '/upload-profile-picture', []);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testUploadProfilePictureReturns403ForOtherUser(): void
    {
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxPostRequest('/user/' . self::MEMBER_ID . '/upload-profile-picture', []);

        $this->tester->seeResponseCodeIs(403);
    }

    // =========================================================================
    // No org/project translators active for UserController
    // =========================================================================

    public function testUserEndpointsHaveNoOrgTranslator(): void
    {
        // User endpoints should work without any org slug in URL
        $this->loginAs(self::OWNER_ID, UserRole::USER, self::OWNER_EMAIL);
        $this->tester->sendAjaxGetRequest('/user/' . self::OWNER_ID);
        $this->tester->seeResponseCodeIs(200);
    }
}
