<?php

namespace api\tests\unit\components\traits;

use api\components\traits\RefreshTokenHandlerTrait;
use api\models\UserRefreshToken;
use api\models\query\UserRefreshTokenQuery;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\UserFixture;
use common\fixtures\UserRefreshTokenFixture;
use common\models\User;
use Yii;
use yii\base\Event;
use yii\web\ServerErrorHttpException;
use yii\web\UnauthorizedHttpException;

class RefreshTokenHandlerTraitTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'user'  => UserFixture::class,
            'user_refresh_token' => UserRefreshTokenFixture::class,
        ];
    }

    protected function _before()
    {
        parent::_before();

        if (!Yii::$app->has('request')) {
            Yii::$app->set('request', [
                'class' => 'yii\web\Request',
            ]);
        }

        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        $_SERVER['HTTP_USER_AGENT'] = 'TestAgent/1.0';
    }

    // -------------------------------------------------------------------------
    // validateRefreshToken
    // -------------------------------------------------------------------------

    public function testValidateRefreshTokenThrowsExceptionWhenRevoked()
    {
        $this->expectException(UnauthorizedHttpException::class);
        $this->expectExceptionMessage('Refresh token is revoked.');

        $handler = new TestRefreshTokenHandler();
        $token = $this->createMockToken(['revoked_at' => time(), 'expires_at' => time() + 3600]);
        $handler->handlerValidateRefreshToken($token);
    }

    public function testValidateRefreshTokenThrowsExceptionWhenExpired()
    {
        $this->expectException(UnauthorizedHttpException::class);
        $this->expectExceptionMessage('Refresh token is revoked.');

        $handler = new TestRefreshTokenHandler();
        $token = $this->createMockToken(['revoked_at' => null, 'expires_at' => time() - 3600]);
        $handler->handlerValidateRefreshToken($token);
    }

    public function testValidateRefreshTokenPassesForValidToken()
    {
        $handler = new TestRefreshTokenHandler();
        $token = $this->createMockToken(['revoked_at' => null, 'expires_at' => time() + 3600]);

        $handler->handlerValidateRefreshToken($token);

        $this->assertTrue(true);
    }

    public function testValidateMultipleTokenStates()
    {
        $handler = new TestRefreshTokenHandler();

        $testCases = [
            ['name' => 'Valid token',               'revoked_at' => null,   'expires_at' => time() + 86400, 'shouldPass' => true],
            ['name' => 'Revoked token',             'revoked_at' => time(), 'expires_at' => time() + 86400, 'shouldPass' => false],
            ['name' => 'Expired token',             'revoked_at' => null,   'expires_at' => time() - 1,     'shouldPass' => false],
            ['name' => 'Revoked and expired token', 'revoked_at' => time(), 'expires_at' => time() - 86400, 'shouldPass' => false],
        ];

        foreach ($testCases as $testCase) {
            $token = $this->createMockToken([
                'revoked_at' => $testCase['revoked_at'],
                'expires_at' => $testCase['expires_at'],
            ]);

            if ($testCase['shouldPass']) {
                $handler->handlerValidateRefreshToken($token);
                $this->assertTrue(true, $testCase['name'] . ' should pass validation');
            } else {
                try {
                    $handler->handlerValidateRefreshToken($token);
                    $this->fail($testCase['name'] . ' should throw exception');
                } catch (UnauthorizedHttpException $e) {
                    $this->assertTrue(true, $testCase['name'] . ' correctly threw exception');
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // addToCookie
    // -------------------------------------------------------------------------

    public function testAddToCookieSetsCorrectCookieAttributes()
    {
        $handler = new TestRefreshTokenHandler();
        $token = 'test-token-value-' . bin2hex(random_bytes(16));

        $handler->handlerAddToCookie($token);

        $cookie = Yii::$app->response->cookies->get('refresh-token');

        $this->assertNotNull($cookie);
        $this->assertEquals('refresh-token', $cookie->name);
        $this->assertEquals($token, $cookie->value);
        $this->assertTrue($cookie->httpOnly);
        $this->assertEquals(\yii\web\Cookie::SAME_SITE_LAX, $cookie->sameSite);
        $this->assertFalse($cookie->secure);
        $this->assertEquals('/', $cookie->path);
    }

    public function testAddToCookieRemovesExistingCookie()
    {
        $handler = new TestRefreshTokenHandler();

        $handler->handlerAddToCookie('token-1');
        $this->assertEquals('token-1', Yii::$app->response->cookies->get('refresh-token')->value);

        $handler->handlerAddToCookie('token-2');
        $this->assertEquals('token-2', Yii::$app->response->cookies->get('refresh-token')->value);
    }

    public function testAddToCookieWithLongToken()
    {
        $handler = new TestRefreshTokenHandler();
        $token = Yii::$app->security->generateRandomString(64);
        $handler->handlerAddToCookie($token);

        $cookie = Yii::$app->response->cookies->get('refresh-token');
        $this->assertEquals($token, $cookie->value);
        $this->assertEquals(64, strlen($cookie->value));
    }

    // -------------------------------------------------------------------------
    // getExpiredRefreshToken
    // -------------------------------------------------------------------------

    public function testGetExpiredRefreshTokenReturnsQuery()
    {
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerGetExpiredRefreshToken('some-token');

        $this->assertInstanceOf(UserRefreshTokenQuery::class, $result);
    }

    // -------------------------------------------------------------------------
    // getRefreshToken
    // -------------------------------------------------------------------------

    public function testGetRefreshTokenWithUserReturnsNullWhenNotFound()
    {
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerGetRefreshToken('nonexistent-token', true);

        $this->assertNull($result);
    }

    public function testGetRefreshTokenWithoutUserReturnsNullWhenNotFound()
    {
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerGetRefreshToken('nonexistent-token', false);

        $this->assertNull($result);
    }

    // -------------------------------------------------------------------------
    // updateExistingRefreshToken
    // -------------------------------------------------------------------------

    public function testUpdateExistingRefreshTokenThrowsWhenRevoked()
    {
        $this->expectException(UnauthorizedHttpException::class);
        $this->expectExceptionMessage('Refresh token is revoked.');

        $handler = new TestRefreshTokenHandler();
        $token = $this->createSavableMockToken(['revoked_at' => time(), 'expires_at' => time() + 3600], true);

        $handler->handlerUpdateExistingRefreshToken($token, [
            'token' => 'new-token',
            'expiresInSeconds' => 3600,
            'ip' => '127.0.0.1',
            'agent' => 'TestAgent/1.0',
        ]);
    }

    public function testUpdateExistingRefreshTokenThrowsOnSaveFailure()
    {
        $this->expectException(ServerErrorHttpException::class);

        $handler = new TestRefreshTokenHandler();
        $token = $this->createSavableMockToken(['revoked_at' => null, 'expires_at' => time() + 3600], false);

        $handler->handlerUpdateExistingRefreshToken($token, [
            'token' => 'new-token',
            'expiresInSeconds' => 3600,
            'ip' => '127.0.0.1',
            'agent' => 'TestAgent/1.0',
        ]);
    }

    public function testUpdateExistingRefreshTokenUpdatesFieldsOnSuccess()
    {
        $handler = new TestRefreshTokenHandler();
        $token = $this->createSavableMockToken(['revoked_at' => null, 'expires_at' => time() + 3600], true);

        $before = time();
        $result = $handler->handlerUpdateExistingRefreshToken($token, [
            'token' => 'updated-token',
            'expiresInSeconds' => 7200,
            'ip' => '10.0.0.1',
            'agent' => 'Mozilla/5.0',
        ]);

        $this->assertSame($token, $result);
        $this->assertEquals('updated-token', $result->token);
        $this->assertEquals('10.0.0.1', $result->ip);
        $this->assertEquals('Mozilla/5.0', $result->user_agent);
        $this->assertGreaterThanOrEqual($before + 7200, $result->expires_at);
    }

    // -------------------------------------------------------------------------
    // createNewRefreshToken
    // -------------------------------------------------------------------------

    public function testCreateNewRefreshTokenThrowsOnSaveFailure()
    {
        $this->expectException(ServerErrorHttpException::class);

        $handler = new TestRefreshTokenHandler();
        $mockToken = $this->getMockBuilder(UserRefreshToken::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['save', 'getFirstErrors'])
            ->getMock();
        $mockToken->method('save')->willReturn(false);
        $mockToken->method('getFirstErrors')->willReturn(['token' => 'already exists']);

        $handler->setNewRefreshTokenFactory(function () use ($mockToken) {
            return $mockToken;
        });

        $handler->handlerCreateNewRefreshToken('user-uuid', [
            'token' => 'some-token',
            'expiresInSeconds' => 3600,
            'ip' => '127.0.0.1',
            'agent' => 'TestAgent',
        ]);
    }

    public function testCreateNewRefreshTokenSaveFails()
    {
        $handler = new TestRefreshTokenHandler();

        $user = User::find()->byUsername('bayer.hudson')->one();

        Event::on(UserRefreshToken::class, UserRefreshToken::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false;
        });

        $this->expectException(ServerErrorHttpException::class);
        $this->expectExceptionMessageMatches('/Failed to create refresh token: /');
        $handler->handlerCreateNewRefreshToken($user->id, [
            'token' => 'some-token',
            'ip' => '127.0.0.1',
            'agent' => 'TestAgent',
            'expiresInSeconds' => 3600,
        ]);
    }


    // -------------------------------------------------------------------------
    // updateRefreshTokenExpiry
    // -------------------------------------------------------------------------

    public function testUpdateRefreshTokenExpiryThrowsOnSaveFailure()
    {
        $this->expectException(ServerErrorHttpException::class);

        $handler = new TestRefreshTokenHandler();
        $token = $this->createSavableMockToken(['revoked_at' => null, 'expires_at' => time() - 1], false);

        $handler->handlerUpdateRefreshTokenExpiry($token, [
            'token' => 'refreshed-token',
            'expiresInSeconds' => 3600,
        ]);
    }

    public function testUpdateRefreshTokenExpiryUpdatesFieldsOnSuccess()
    {
        $handler = new TestRefreshTokenHandler();
        $token = $this->createSavableMockToken(['revoked_at' => null, 'expires_at' => time() - 1], true);

        $before = time();
        $result = $handler->handlerUpdateRefreshTokenExpiry($token, [
            'token' => 'new-expiry-token',
            'expiresInSeconds' => 1800,
        ]);

        $this->assertSame($token, $result);
        $this->assertEquals('new-expiry-token', $result->token);
        $this->assertGreaterThanOrEqual($before + 1800, $result->expires_at);
    }

    // -------------------------------------------------------------------------
    // createRefreshToken — branch coverage
    // -------------------------------------------------------------------------

    public function testCreateRefreshTokenDelegatesToUpdateWhenCredentialIsTokenInstance()
    {
        $handler = new TestRefreshTokenHandler();

        // Non-revoked, valid token instance as credential → updateExistingRefreshToken path
        $existingToken = $this->createSavableMockToken(['revoked_at' => null, 'expires_at' => time() + 3600], true);

        $result = $handler->handlerCreateRefreshToken($existingToken);

        $this->assertInstanceOf(UserRefreshToken::class, $result);
    }

    public function testCreateRefreshTokenThrowsWhenCredentialTokenIsRevoked()
    {
        $this->expectException(UnauthorizedHttpException::class);

        $handler = new TestRefreshTokenHandler();
        $revokedToken = $this->createSavableMockToken(['revoked_at' => time(), 'expires_at' => time() + 3600], true);

        $handler->handlerCreateRefreshToken($revokedToken);
    }

    // -------------------------------------------------------------------------
    // createRefreshToken — DB-backed string credential branches
    // -------------------------------------------------------------------------

    public function testCreateRefreshTokenCreatesNewWhenNoneExists()
    {
        // User 3 has no token in the fixture → new token should be created
        $userId = '01900000-0000-7000-8000-000000000003';
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerCreateRefreshToken($userId);

        $this->assertInstanceOf(UserRefreshToken::class, $result);
        $this->assertEquals($userId, $result->user_id);
        $this->assertEquals('127.0.0.1', $result->ip);
        $this->assertNotEmpty($result->token);
        $this->assertNull($result->revoked_at);
        $this->assertGreaterThan(time(), $result->expires_at);

        $persisted = UserRefreshToken::find()->byToken($result->token)->one();
        $this->assertNotNull($persisted);
    }

    public function testCreateRefreshTokenReturnsExistingValidToken()
    {
        // User 1 already has a valid token in the fixture for 127.0.0.1
        $userId = '01900000-0000-7000-8000-000000000001';
        $existingToken = 'valid-refresh-token-000000000000';
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerCreateRefreshToken($userId);

        $this->assertInstanceOf(UserRefreshToken::class, $result);
        $this->assertEquals($existingToken, $result->token);
    }

    public function testCreateRefreshTokenUpdatesExpiredToken()
    {
        // User 2 has an expired token in the fixture for 127.0.0.1
        $userId = '01900000-0000-7000-8000-000000000002';
        $oldToken = 'expired-refresh-token-000000000001';
        $handler = new TestRefreshTokenHandler();

        $result = $handler->handlerCreateRefreshToken($userId);

        $this->assertInstanceOf(UserRefreshToken::class, $result);
        $this->assertNotEquals($oldToken, $result->token);
        $this->assertGreaterThan(time(), $result->expires_at);

        $old = UserRefreshToken::find()->byToken($oldToken)->one();
        $this->assertNull($old);
    }

    public function testCreateRefreshTokenUsesCustomExpiry()
    {
        $userId = '01900000-0000-7000-8000-000000000003';
        $handler = new TestRefreshTokenHandler();
        $customExpiry = 3600;

        $before = time();
        $result = $handler->handlerCreateRefreshToken($userId, $customExpiry);
        $after = time();

        $this->assertGreaterThanOrEqual($before + $customExpiry, $result->expires_at);
        $this->assertLessThanOrEqual($after + $customExpiry, $result->expires_at);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createMockToken(array $attributes = [])
    {
        $token = $this->getMockBuilder(UserRefreshToken::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isRevoked', 'isValid'])
            ->getMock();

        $revokedAt = $attributes['revoked_at'] ?? null;
        $expiresAt = $attributes['expires_at'] ?? time() + 3600;

        $token->method('isRevoked')->willReturn($revokedAt !== null);
        $token->method('isValid')->willReturn($expiresAt > time() && $revokedAt === null);

        $token->revoked_at = $revokedAt;
        $token->expires_at = $expiresAt;

        return $token;
    }

    private function createSavableMockToken(array $attributes = [], bool $saveReturns = true)
    {
        $token = $this->getMockBuilder(UserRefreshToken::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isRevoked', 'isValid', 'save', 'getFirstErrors'])
            ->getMock();

        $revokedAt = $attributes['revoked_at'] ?? null;
        $expiresAt = $attributes['expires_at'] ?? time() + 3600;

        $token->method('isRevoked')->willReturn($revokedAt !== null);
        $token->method('isValid')->willReturn($expiresAt > time() && $revokedAt === null);
        $token->method('save')->willReturn($saveReturns);
        $token->method('getFirstErrors')->willReturn(['error' => 'save failed']);

        $token->revoked_at = $revokedAt;
        $token->expires_at = $expiresAt;
        $token->token = 'original-token';
        $token->ip = '127.0.0.1';
        $token->user_agent = 'OriginalAgent/1.0';

        return $token;
    }
}

class TestRefreshTokenHandler
{
    use RefreshTokenHandlerTrait {
        createNewRefreshToken as traitCreateNewRefreshToken;
    }

    /** @var callable|null */
    private $newRefreshTokenFactory = null;

    public function setNewRefreshTokenFactory(callable $factory): void
    {
        $this->newRefreshTokenFactory = $factory;
    }

    /**
     * Override createNewRefreshToken to support factory injection for testing save failures.
     */
    protected function createNewRefreshToken(string $credential, array $credentialOptions): UserRefreshToken
    {
        if ($this->newRefreshTokenFactory !== null) {
            $refreshToken = ($this->newRefreshTokenFactory)();
            if (!$refreshToken->save()) {
                throw new \yii\web\ServerErrorHttpException(
                    'Failed to create refresh token: ' . implode(', ', $refreshToken->getFirstErrors())
                );
            }
            return $refreshToken;
        }

        return $this->traitCreateNewRefreshToken($credential, $credentialOptions);
    }

    public function handlerValidateRefreshToken(UserRefreshToken $refreshToken)
    {
        return $this->validateRefreshToken($refreshToken);
    }

    public function handlerAddToCookie(string $token)
    {
        return $this->addToCookie($token);
    }

    public function handlerGetExpiredRefreshToken(string $token)
    {
        return $this->getExpiredRefreshToken($token);
    }

    public function handlerGetRefreshToken(string $token, bool $withUser = false)
    {
        return $this->getRefreshToken($token, $withUser);
    }

    public function handlerCreateRefreshToken(string|UserRefreshToken $credential, int $expiresInSeconds = 60 * 60 * 24 * 14): UserRefreshToken|null
    {
        return $this->createRefreshToken($credential, $expiresInSeconds);
    }

    public function handlerUpdateExistingRefreshToken(UserRefreshToken $refreshToken, array $options): UserRefreshToken
    {
        return $this->updateExistingRefreshToken($refreshToken, $options);
    }

    public function handlerCreateNewRefreshToken(string $credential, array $options): UserRefreshToken
    {
        return $this->createNewRefreshToken($credential, $options);
    }

    public function handlerUpdateRefreshTokenExpiry(UserRefreshToken $token, array $options): UserRefreshToken
    {
        return $this->updateRefreshTokenExpiry($token, $options);
    }
}
