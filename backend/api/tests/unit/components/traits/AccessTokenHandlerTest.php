<?php

namespace api\tests\unit\components\traits;

use api\components\traits\AccessTokenHandler;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\models\UserRole;
use DateTimeImmutable;
use Yii;

class AccessTokenHandlerTest extends Unit
{
    protected UnitTester $tester;

    protected function _before()
    {
        parent::_before();

        // Ensure JWT config is available
        if (!isset(Yii::$app->params['backendUrl'])) {
            Yii::$app->params['backendUrl'] = 'http://api.test';
        }
        if (!isset(Yii::$app->params['frontendUrl'])) {
            Yii::$app->params['frontendUrl'] = 'http://frontend.test';
        }
    }

    public function testCreateAccessTokenWithValidData()
    {
        $handler = new TestAccessTokenHandler();

        $userId = 'test-user-123';
        $role = UserRole::USER;
        $email = 'test@example.com';

        $token = $handler->generateAccessToken($userId, $role, $email);

        // Verify token is created
        $this->assertNotNull($token);

        // Verify claims
        $this->assertEquals($userId, $token->claims()->get('uid'));
        $this->assertEquals($role, $token->claims()->get('role'));
        $this->assertEquals($email, $token->claims()->get('email'));
    }

    public function testAccessTokenContainsRequiredClaims()
    {
        $handler = new TestAccessTokenHandler();

        $token = $handler->generateAccessToken('user-456', UserRole::ADMIN, 'admin@example.com');

        // Check all required claims exist
        $this->assertTrue($token->claims()->has('uid'));
        $this->assertTrue($token->claims()->has('role'));
        $this->assertTrue($token->claims()->has('email'));
        $this->assertTrue($token->claims()->has('iss'));
        $this->assertTrue($token->claims()->has('aud'));
        $this->assertTrue($token->claims()->has('jti'));
        $this->assertTrue($token->claims()->has('iat'));
        $this->assertTrue($token->claims()->has('nbf'));
        $this->assertTrue($token->claims()->has('exp'));
    }

    public function testAccessTokenIssuerAndAudience()
    {
        $handler = new TestAccessTokenHandler();

        $token = $handler->generateAccessToken('user-789', UserRole::USER, 'user@example.com');

        $this->assertEquals(Yii::$app->params['backendUrl'], $token->claims()->get('iss'));
        $this->assertEquals([Yii::$app->params['frontendUrl']], $token->claims()->get('aud'));
    }

    public function testAccessTokenExpirationTime()
    {
        $handler = new TestAccessTokenHandler();

        $beforeTime = new DateTimeImmutable();
        $token = $handler->generateAccessToken('user-expire', UserRole::USER, 'expire@example.com');
        $afterTime = new DateTimeImmutable('+21 minutes');

        $expiresAt = $token->claims()->get('exp');

        // Token should expire in ~20 minutes (between before and after time)
        $this->assertGreaterThanOrEqual($beforeTime->modify('+19 minutes')->getTimestamp(), $expiresAt->getTimestamp());
        $this->assertLessThanOrEqual($afterTime->getTimestamp(), $expiresAt->getTimestamp());
    }

    public function testAccessTokenIssuedAtAndNotBefore()
    {
        $handler = new TestAccessTokenHandler();

        $beforeTime = new DateTimeImmutable('-1 second');
        $token = $handler->generateAccessToken('user-time', UserRole::USER, 'time@example.com');
        $afterTime = new DateTimeImmutable('+1 second');

        $issuedAt = $token->claims()->get('iat');
        $notBefore = $token->claims()->get('nbf');

        // Both should be "now"
        $this->assertGreaterThanOrEqual($beforeTime->getTimestamp(), $issuedAt->getTimestamp());
        $this->assertLessThanOrEqual($afterTime->getTimestamp(), $issuedAt->getTimestamp());

        $this->assertEquals($issuedAt, $notBefore);
    }

    public function testAccessTokenHasUniqueJti()
    {
        $handler = new TestAccessTokenHandler();

        $token1 = $handler->generateAccessToken('user1', UserRole::USER, 'user1@example.com');
        $token2 = $handler->generateAccessToken('user2', UserRole::USER, 'user2@example.com');

        $jti1 = $token1->claims()->get('jti');
        $jti2 = $token2->claims()->get('jti');

        // JTI should be unique for each token
        $this->assertNotEquals($jti1, $jti2);

        // JTI should be a hex string (32 characters from 16 random bytes)
        $this->assertEquals(32, strlen($jti1));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $jti1);
    }

    public function testAccessTokenWithDifferentRoles()
    {
        $handler = new TestAccessTokenHandler();

        $roles = [UserRole::USER, UserRole::ADMIN];

        foreach ($roles as $role) {
            $token = $handler->generateAccessToken('user-role-test', $role, 'role@example.com');

            $this->assertEquals($role, $token->claims()->get('role'));
        }
    }

    public function testAccessTokenIsSigned()
    {
        $handler = new TestAccessTokenHandler();

        $token = $handler->generateAccessToken('signed-user', UserRole::USER, 'signed@example.com');

        // Verify the token has a signature
        $this->assertNotEmpty($token->signature()->toString());

        // Verify token can be validated
        $constraints = Yii::$app->jwt->validationConstraints();
        $isValid = Yii::$app->jwt->validator()->validate($token, ...$constraints);

        $this->assertTrue($isValid);
    }

    public function testAccessTokenToString()
    {
        $handler = new TestAccessTokenHandler();

        $token = $handler->generateAccessToken('string-user', UserRole::USER, 'string@example.com');
        $tokenString = $token->toString();

        // JWT format: header.payload.signature
        $parts = explode('.', $tokenString);
        $this->assertCount(3, $parts);

        // Each part should be base64url encoded
        foreach ($parts as $part) {
            $this->assertNotEmpty($part);
        }
    }
}

class TestAccessTokenHandler
{
    use AccessTokenHandler;
    private $jwtConfig;

    public function __construct()
    {
        $this->jwtConfig = Yii::$app->jwt;
    }

    // Expose the protected method publicly for testing
    public function generateAccessToken(string $userId, UserRole $role, string $email)
    {
        return $this->createAccessToken($userId, $role, $email);
    }
}
