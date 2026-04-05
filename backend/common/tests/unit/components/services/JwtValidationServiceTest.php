<?php

namespace common\tests\unit\components\services;

use Codeception\Test\Unit;
use common\components\services\JwtValidationService;
use common\tests\UnitTester;
use DateTimeImmutable;
use Lcobucci\JWT\Token;
use Yii;

class JwtValidationServiceTest extends Unit
{
    protected UnitTester $tester;
    private JwtValidationService $service;

    protected function _before()
    {
        parent::_before();
        $this->service = new JwtValidationService(Yii::$app->jwt);
    }

    public function testGetUserIdFromValidToken()
    {
        $userId = '12345';

        // Create a real token using your JWT config
        $token = Yii::$app->jwt->builder()
            ->withClaim('uid', $userId)
            ->expiresAt(new DateTimeImmutable('+1 hour'))
            ->getToken(Yii::$app->jwt->signer(), Yii::$app->jwt->signingKey());

        $result = $this->service->getUserIdFromToken($token->toString());

        verify($result)->equals($userId, "The user ID extracted from the token should match the expected value of: $userId");
    }

    public function testGetUserIdFromExpiredToken()
    {
        // Create an expired token
        $token = Yii::$app->jwt->builder()
            ->withClaim('uid', '12345')
            ->expiresAt(new DateTimeImmutable('-1 hour'))
            ->getToken(Yii::$app->jwt->signer(), Yii::$app->jwt->signingKey());

        $result = $this->service->getUserIdFromToken($token->toString());

        verify($result)->null('The user ID extracted from an expired token should be null.');
    }

    public function testGetUserIdFromInvalidToken()
    {
        $result = $this->service->getUserIdFromToken('invalid.token.string');

        verify($result)->null('The user ID extracted from an invalid token should be null.');
    }

    public function testGetUserIdFromEmptyToken()
    {
        $result = $this->service->getUserIdFromToken('');

        verify($result)->null('The user ID extracted from an empty token should be null.');
    }

    public function testGetUserIdFromMalformedToken()
    {
        // Token without proper structure
        $result = $this->service->getUserIdFromToken('header.payload');

        verify($result)->null('The user ID extracted from a malformed token should be null.');
    }

    public function testGetUserIdFromTokenWithoutUidClaim()
    {
        // Create a token without the uid claim
        $token = Yii::$app->jwt->builder()
            ->expiresAt(new DateTimeImmutable('+1 hour'))
            ->getToken(Yii::$app->jwt->signer(), Yii::$app->jwt->signingKey());

        $result = $this->service->getUserIdFromToken($token->toString());

        // Should still work but return null since uid is missing
        verify($result)->null('The user ID extracted from a token without uid claim should be null.');
    }

    public function testGetUserIdWithDifferentUserIds()
    {
        $testUserIds = ['user-123', 'abc-def-ghi', '999', 'uuid-format-id'];

        foreach ($testUserIds as $userId) {
            $token = Yii::$app->jwt->builder()
                ->withClaim('uid', $userId)
                ->expiresAt(new DateTimeImmutable('+1 hour'))
                ->getToken(Yii::$app->jwt->signer(), Yii::$app->jwt->signingKey());

            $result = $this->service->getUserIdFromToken($token->toString());

            verify($result)->equals($userId, "The user ID extracted from the token should match the expected value for user ID: $userId.");
        }
    }

    public function testGetUserIdFromTokenFailsWhenNotUnencryptedToken()
    {
        // Mock Token that is not an instance of UnencryptedToken    
        $invalidTokenMock = $this->createMock(Token::class);

        // Mock the parser to return our invalid token mock
        $parserMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['parse'])
            ->getMock();
        $parserMock->method('parse')->willReturn($invalidTokenMock);

        // Mock the JWT config to return our parser mock
        $jwtConfigMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['parser'])
            ->getMock();
        $jwtConfigMock->method('parser')->willReturn($parserMock);

        $loggerMock = $this->createMock(\yii\log\Logger::class);

        $loggerMock->expects($this->once())
            ->method('log')
            ->with(
                $this->stringContains('Invalid token type: expected unencrypted token'), // The message
                \yii\log\Logger::LEVEL_ERROR,                                            // The level
                $this->stringContains('JwtValidationService::getUserIdFromToken')        // The category
            );

        // Inject the mock logger into the Yii application
        Yii::setLogger($loggerMock);

        $service = new JwtValidationService($jwtConfigMock);

        $result = $service->getUserIdFromToken('fake-token-string');

        verify($result)->null('The method should return null if the token is not an UnencryptedToken.');
    }
}
