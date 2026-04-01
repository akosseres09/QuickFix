<?php

namespace api\tests\unit\components\traits;

use api\components\traits\RefreshTokenHandlerTrait;
use api\models\UserRefreshToken;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use Yii;
use yii\web\UnauthorizedHttpException;

class RefreshTokenHandlerTraitTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();

        // Mock request component
        if (!Yii::$app->has('request')) {
            Yii::$app->set('request', [
                'class' => 'yii\web\Request',
            ]);
        }
    }

    public function testValidateRefreshTokenThrowsExceptionWhenRevoked()
    {
        $this->expectException(UnauthorizedHttpException::class);
        $this->expectExceptionMessage('Refresh token is revoked.');

        $handler = new TestRefreshTokenHandler();

        // Create a mock revoked token
        $token = $this->createMockToken([
            'revoked_at' => time(),
            'expires_at' => time() + 3600,
        ]);

        $handler->validateToken($token);
    }

    public function testValidateRefreshTokenThrowsExceptionWhenExpired()
    {
        $this->expectException(UnauthorizedHttpException::class);
        $this->expectExceptionMessage('Refresh token is revoked.');

        $handler = new TestRefreshTokenHandler();

        // Create a mock expired token
        $token = $this->createMockToken([
            'revoked_at' => null,
            'expires_at' => time() - 3600, // Expired 1 hour ago
        ]);

        $handler->validateToken($token);
    }

    public function testValidateRefreshTokenPassesForValidToken()
    {
        $handler = new TestRefreshTokenHandler();

        // Create a mock valid token
        $token = $this->createMockToken([
            'revoked_at' => null,
            'expires_at' => time() + 3600, // Valid for 1 hour
        ]);

        // Should not throw exception
        $handler->validateToken($token);

        $this->assertTrue(true); // If we get here, validation passed
    }

    public function testAddToCookieSetsCorrectCookieAttributes()
    {
        $handler = new TestRefreshTokenHandler();
        $token = 'test-token-value-' . bin2hex(random_bytes(16));

        $handler->addTokenToCookie($token);

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

        // Add first cookie
        $token1 = 'token-1';
        $handler->addTokenToCookie($token1);

        $cookie1 = Yii::$app->response->cookies->get('refresh-token');
        $this->assertEquals($token1, $cookie1->value);

        // Add second cookie (should replace first)
        $token2 = 'token-2';
        $handler->addTokenToCookie($token2);

        $cookie2 = Yii::$app->response->cookies->get('refresh-token');
        $this->assertEquals($token2, $cookie2->value);
    }

    public function testAddToCookieWithLongToken()
    {
        $handler = new TestRefreshTokenHandler();

        // Test with a 64-character token (common length)
        $token = Yii::$app->security->generateRandomString(64);
        $handler->addTokenToCookie($token);

        $cookie = Yii::$app->response->cookies->get('refresh-token');

        $this->assertEquals($token, $cookie->value);
        $this->assertEquals(64, strlen($cookie->value));
    }

    public function testValidateMultipleTokenStates()
    {
        $handler = new TestRefreshTokenHandler();

        $testCases = [
            [
                'name' => 'Valid token',
                'revoked_at' => null,
                'expires_at' => time() + 86400,
                'shouldPass' => true,
            ],
            [
                'name' => 'Revoked token',
                'revoked_at' => time(),
                'expires_at' => time() + 86400,
                'shouldPass' => false,
            ],
            [
                'name' => 'Expired token',
                'revoked_at' => null,
                'expires_at' => time() - 1,
                'shouldPass' => false,
            ],
            [
                'name' => 'Revoked and expired token',
                'revoked_at' => time(),
                'expires_at' => time() - 86400,
                'shouldPass' => false,
            ],
        ];

        foreach ($testCases as $testCase) {
            $token = $this->createMockToken([
                'revoked_at' => $testCase['revoked_at'],
                'expires_at' => $testCase['expires_at'],
            ]);

            if ($testCase['shouldPass']) {
                $handler->validateToken($token);
                $this->assertTrue(true, $testCase['name'] . ' should pass validation');
            } else {
                try {
                    $handler->validateToken($token);
                    $this->fail($testCase['name'] . ' should throw exception');
                } catch (UnauthorizedHttpException $e) {
                    $this->assertTrue(true, $testCase['name'] . ' correctly threw exception');
                }
            }
        }
    }

    private function createMockToken(array $attributes = [])
    {
        $token = $this->getMockBuilder(UserRefreshToken::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isRevoked', 'isValid'])
            ->getMock();

        $revokedAt = $attributes['revoked_at'] ?? null;
        $expiresAt = $attributes['expires_at'] ?? time() + 3600;

        $token->method('isRevoked')
            ->willReturn($revokedAt !== null);

        $token->method('isValid')
            ->willReturn($expiresAt > time() && $revokedAt === null);

        $token->revoked_at = $revokedAt;
        $token->expires_at = $expiresAt;

        return $token;
    }
}

class TestRefreshTokenHandler
{
    use RefreshTokenHandlerTrait;

    // Expose protected methods publicly for testing
    public function validateToken(UserRefreshToken $refreshToken)
    {
        return $this->validateRefreshToken($refreshToken);
    }

    public function addTokenToCookie(string $token)
    {
        return $this->addToCookie($token);
    }
};
