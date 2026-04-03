<?php

namespace api\tests\functional\controllers;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\FunctionalTester;
use common\fixtures\UserFixture;
use common\fixtures\UserRefreshTokenFixture;
use common\models\User;
use common\models\UserRole;
use Yii;

class AuthControllerTest extends Unit
{
    use AccessTokenHandler;
    protected FunctionalTester $tester;
    private $jwtConfig;

    // ---------------------------------------------------------------------------
    // Fixture constants (aligned with common/tests/_data/)
    // ---------------------------------------------------------------------------

    private const ACTIVE_USER_EMAIL    = 'nicole.paucek@schultz.info';
    private const ACTIVE_USER_PASSWORD = 'password_0';
    private const INACTIVE_USER_EMAIL  = 'jane.doe@example.com';

    /** Verification token for the inactive user (jane.doe) */
    private const INACTIVE_USER_VERIFY_TOKEN = 'testVerificationToken22222222222222222222';

    /** Password-reset token for the active user (bayer.hudson), expires 2027 */
    private const ACTIVE_USER_RESET_TOKEN = 'ExzkCOaYc1L8IOBs4wdTGGbgNiG3Wz1I_1402312317';

    /** Refresh-token fixtures */
    private const VALID_REFRESH_TOKEN   = 'valid-refresh-token-000000000000';
    private const EXPIRED_REFRESH_TOKEN = 'expired-refresh-token-000000000001';
    private const REVOKED_REFRESH_TOKEN = 'revoked-refresh-token-000000000002';

    // ---------------------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------------------

    public function _fixtures(): array
    {
        return [
            'user'             => UserFixture::class,
            'user_refresh_tokens' => UserRefreshTokenFixture::class,
        ];
    }

    protected function _before()
    {
        $this->jwtConfig = Yii::$app->get('jwt');
        $this->tester->haveServerParameter('REMOTE_ADDR', '127.0.0.1');
        return parent::_before();
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function loginUser(string $id, UserRole $role, string $email): void
    {
        $jwt = $this->createAccessToken($id, $role, $email)->toString();
        $this->tester->haveHttpHeader('Authorization', 'Bearer ' . $jwt);
    }

    // ---------------------------------------------------------------------------
    // actionLogin  POST /auth/login
    // ---------------------------------------------------------------------------

    public function testLoginReturnsAccessTokenOnValidCredentials(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email'    => self::ACTIVE_USER_EMAIL,
            'password' => self::ACTIVE_USER_PASSWORD,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('access_token', $json['data']);
        $this->assertNotEmpty($json['data']['access_token']);
    }

    public function testLoginSetsRefreshTokenCookieOnSuccess(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email'    => self::ACTIVE_USER_EMAIL,
            'password' => self::ACTIVE_USER_PASSWORD,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $this->tester->seeCookie('refresh-token');
    }

    public function testLoginReturnsUnauthorizedForWrongPassword(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email'    => self::ACTIVE_USER_EMAIL,
            'password' => 'wrong_password',
        ]);

        $this->tester->seeResponseCodeIs(401);
    }

    public function testLoginReturnsUnauthorizedForNonExistentEmail(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => self::ACTIVE_USER_PASSWORD,
        ]);

        $this->tester->seeResponseCodeIs(401);
    }

    public function testLoginReturnsBadRequestWhenEmailMissing(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'password' => self::ACTIVE_USER_PASSWORD,
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testLoginReturnsBadRequestWhenPasswordMissing(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email' => self::ACTIVE_USER_EMAIL,
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    // ---------------------------------------------------------------------------
    // actionRefresh  GET /auth/refresh
    // ---------------------------------------------------------------------------

    public function testRefreshReturnsNewAccessTokenWithValidCookie(): void
    {
        $this->tester->setCookie('refresh-token', self::VALID_REFRESH_TOKEN);
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('access_token', $json['data']);
        $this->assertNotEmpty($json['data']['access_token']);
    }

    public function testRefreshReturnsBadRequestWhenNoCookiePresent(): void
    {
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(400);
    }

    public function testRefreshReturnsBadRequestWithUnknownToken(): void
    {
        $this->tester->setCookie('refresh-token', 'non-existent-token-xyz');
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(400);
    }

    public function testRefreshReturnsErrorWithValidTokenButNonExistentOrInactiveUser(): void
    {
        $token = $this->tester->grabFixture('user_refresh_tokens', 'user_does_not_exist');
        $this->tester->setCookie('refresh-token', $token['token']); // belongs to non-existent user
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(401);
        $this->tester->dontSeeCookie('refresh-token'); // token should be removed if user is invalid
    }

    public function testRefreshReturnsErrorWithRevokedToken(): void
    {
        $this->tester->setCookie('refresh-token', self::REVOKED_REFRESH_TOKEN);
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(400);
    }

    public function testRefreshReturnsErrorWithExpiredToken(): void
    {
        $this->tester->setCookie('refresh-token', self::EXPIRED_REFRESH_TOKEN);
        $this->tester->sendAjaxGetRequest('/auth/refresh');

        $this->tester->seeResponseCodeIs(401);
        $this->tester->dontSeeCookie('refresh-token'); // expired token should be removed
    }

    // ---------------------------------------------------------------------------
    // actionLogout  POST /auth/logout
    // ---------------------------------------------------------------------------

    public function testLogoutSucceedsWithValidRefreshTokenCookie(): void
    {
        $token = $this->tester->grabFixture('user_refresh_tokens', 'valid_token');
        $user = User::findOne(['id' => $token['user_id']]);

        $this->loginUser($user->id, $user->getRole(), $user->email);

        $this->tester->setCookie('refresh-token', $token['token']);
        $this->tester->sendAjaxPostRequest('/auth/logout', []);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
    }

    public function testLogoutReturnsBadRequestWhenNoCookiePresent(): void
    {
        $user = User::findOne(['email' => self::ACTIVE_USER_EMAIL]);
        $this->loginUser($user->id, $user->getRole(), $user->email);

        $this->tester->sendAjaxPostRequest('/auth/logout', []);
        $this->tester->seeResponseCodeIs(400);
    }

    // ---------------------------------------------------------------------------
    // actionMe  GET /auth/me  (requires Bearer token)
    // ---------------------------------------------------------------------------

    public function testMeReturnsAuthenticatedUserData(): void
    {
        $token = $this->loginAndGetToken();

        $this->tester->haveHttpHeader('Authorization', 'Bearer ' . $token);
        $this->tester->sendAjaxGetRequest('/auth/me');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertEquals(self::ACTIVE_USER_EMAIL, $json['data']['email']);
        $this->assertArrayHasKey('id', $json['data']);
        $this->assertArrayHasKey('username', $json['data']);
        $this->assertArrayHasKey('role', $json['data']);
    }

    public function testMeReturnsUnauthorizedWithNoAuthorizationHeader(): void
    {
        $this->tester->sendAjaxGetRequest('/auth/me');

        $this->tester->seeResponseCodeIs(401);
    }

    public function testMeReturnsUnauthorizedWithInvalidToken(): void
    {
        $this->tester->haveHttpHeader('Authorization', 'Bearer invalid.token.here');
        $this->tester->sendAjaxGetRequest('/auth/me');

        $this->tester->seeResponseCodeIs(401);
    }

    // ---------------------------------------------------------------------------
    // actionPermissions  GET /auth/permissions  (requires Bearer token)
    // ---------------------------------------------------------------------------

    public function testPermissionsReturnsPermissionsForAuthenticatedUser(): void
    {
        $token = $this->loginAndGetToken();

        $this->tester->haveHttpHeader('Authorization', 'Bearer ' . $token);
        $this->tester->sendAjaxGetRequest('/auth/permissions');

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('permissions', $json['data']);
        $this->assertArrayHasKey('id', $json['data']);
        $this->assertArrayHasKey('role', $json['data']);
        $this->assertArrayHasKey('email', $json['data']);
    }

    public function testPermissionsReturnsUnauthorizedWithNoToken(): void
    {
        $this->tester->sendAjaxGetRequest('/auth/permissions');

        $this->tester->seeResponseCodeIs(401);
    }

    // ---------------------------------------------------------------------------
    // actionSignup  POST /auth/signup
    // ---------------------------------------------------------------------------

    public function testSignupSucceedsWithValidData(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/signup', [
            'username'         => 'newuser',
            'email'            => 'newuser@example.com',
            'password'         => 'SecurePass1!',
            'confirm_password' => 'SecurePass1!',
            'first_name'       => 'New',
            'last_name'        => 'User',
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertTrue($json['data']['success']);
    }

    public function testSignupReturnsValidationErrorsForEmptyPayload(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/signup', []);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testSignupReturnsValidationErrorForDuplicateEmail(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/signup', [
            'username'         => 'uniqueuser',
            'email'            => self::ACTIVE_USER_EMAIL, // already taken
            'password'         => 'SecurePass1!',
            'confirm_password' => 'SecurePass1!',
            'first_name'       => 'New',
            'last_name'        => 'User',
        ]);

        $this->tester->seeResponseCodeIs(422);
        $json = $this->grabJson();
        $this->assertFalse($json['success']);
    }

    public function testSignupReturnsValidationErrorForPasswordMismatch(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/signup', [
            'username'         => 'newuser2',
            'email'            => 'newuser2@example.com',
            'password'         => 'SecurePass1!',
            'confirm_password' => 'DifferentPass1!',
            'first_name'       => 'New',
            'last_name'        => 'User',
        ]);

        $this->tester->seeResponseCodeIs(422);
    }

    // ---------------------------------------------------------------------------
    // actionVerify  POST /auth/verify
    // ---------------------------------------------------------------------------

    public function testVerifyActivatesUserWithValidToken(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/verify', [
            'token' => self::INACTIVE_USER_VERIFY_TOKEN,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertTrue($json['data']['success']);
    }

    public function testVerifyReturnsBadRequestWhenTokenMissing(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/verify', []);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testVerifyReturnsNotFoundForUnknownToken(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/verify', [
            'token' => 'completely-invalid-token-xyz',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // ---------------------------------------------------------------------------
    // actionResendVerificationEmail  POST /auth/resend-verification-email
    // ---------------------------------------------------------------------------

    public function testResendVerificationEmailSucceedsForInactiveUser(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/resend-verification-email', [
            'email' => self::INACTIVE_USER_EMAIL,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertTrue($json['data']['success']);
    }

    public function testResendVerificationEmailReturnsBadRequestWhenEmailMissing(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/resend-verification-email', []);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testResendVerificationEmailReturnsNotFoundForActiveUser(): void
    {
        // Active user should not receive a resend – only inactive accounts apply
        $this->tester->sendAjaxPostRequest('/auth/resend-verification-email', [
            'email' => self::ACTIVE_USER_EMAIL,
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    public function testResendVerificationEmailReturnsNotFoundForUnknownEmail(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/resend-verification-email', [
            'email' => 'nobody@unknown.com',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    // ---------------------------------------------------------------------------
    // actionResetPassword  POST /auth/reset-password
    // ---------------------------------------------------------------------------

    public function testResetPasswordSendsEmailForKnownActiveUser(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'email' => self::ACTIVE_USER_EMAIL,
        ]);

        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertTrue($json['data']['success']);
    }

    public function testResetPasswordReturnsNotFoundForUnknownEmail(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'email' => 'nobody@unknown.com',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    public function testResetPasswordWithValidTokenChangesPassword(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'token'    => self::ACTIVE_USER_RESET_TOKEN,
            'password' => 'NewPassword123!',
        ]);


        $this->tester->seeResponseCodeIs(200);
        $json = $this->grabJson();
        $this->assertTrue($json['success']);
        $this->assertTrue($json['data']['success']);
    }

    public function testResetPasswordReturnsBadRequestWithNoToken(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'password' => 'NewPassword123!',
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    public function testResetPasswordReturnsNotFoundWithUnknownToken(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'token'    => 'invalid-reset-token-xyz',
            'password' => 'NewPassword123!',
        ]);

        $this->tester->seeResponseCodeIs(404);
    }

    public function testResetPasswordReturnsBadRequestWhenNewPasswordMissing(): void
    {
        $this->tester->sendAjaxPostRequest('/auth/reset-password', [
            'token' => self::ACTIVE_USER_RESET_TOKEN,
        ]);

        $this->tester->seeResponseCodeIs(400);
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    /**
     * Logs in with the active fixture user and returns the JWT access token.
     */
    private function loginAndGetToken(): string
    {
        $this->tester->sendAjaxPostRequest('/auth/login', [
            'email'    => self::ACTIVE_USER_EMAIL,
            'password' => self::ACTIVE_USER_PASSWORD,
        ]);

        $json = $this->grabJson();

        return $json['data']['access_token'];
    }

    /**
     * Decodes the last response body as JSON and returns the associative array.
     */
    private function grabJson(): array
    {
        return json_decode($this->tester->grabPageSource(), true);
    }
}
