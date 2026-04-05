<?php

namespace api\tests\unit\models\query;

use api\models\query\UserRefreshTokenQuery;
use api\models\UserRefreshToken;
use api\tests\UnitTester;
use Codeception\Test\Unit;
use common\fixtures\UserFixture;
use common\fixtures\UserRefreshTokenFixture;

class UserRefeshTokenQueryTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'user' => UserFixture::class,
            'user_refresh_token' => UserRefreshTokenFixture::class,
        ];
    }

    protected function _before()
    {
        return parent::_before();
    }

    protected function _after()
    {
        return parent::_after();
    }

    // query test

    public function testQueryIsInstanceOfUserRefreshTokenQuery(): void
    {
        $query = UserRefreshToken::find();
        $this->assertInstanceOf(UserRefreshTokenQuery::class, $query);

        $query->byIp('127.0.0.1');
        $this->assertInstanceOf(UserRefreshTokenQuery::class, $query);

        $query->byToken('some-token');
        $this->assertInstanceOf(UserRefreshTokenQuery::class, $query);

        $query->notExpired();
        $this->assertInstanceOf(UserRefreshTokenQuery::class, $query);

        $query->notRevoked();
        $this->assertInstanceOf(UserRefreshTokenQuery::class, $query);
    }

    // not expired token

    public function testNotExpiredToken(): void
    {
        $query = UserRefreshToken::find()->notExpired()->all();

        foreach ($query as $token) {
            $this->assertGreaterThan(time(), $token->expires_at);
        }
    }

    // by token

    public function testByToken(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'valid_token');

        $query = UserRefreshToken::find()->byToken($token['token'])->one();

        $this->assertNotNull($query);
        $this->assertEquals($token['token'], $query->token);
    }

    // by IP
    public function testByIp(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'valid_token');

        $query = UserRefreshToken::find()->byIp($token['ip'])->all();

        foreach ($query as $token) {
            $this->assertNotNull($token);
            $this->assertEquals($token['ip'], $token->ip);
        }
    }

    // by user ID
    public function testByUserId(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'valid_token');

        $query = UserRefreshToken::find()->byUserId($token['user_id'])->all();

        foreach ($query as $token) {
            $this->assertNotNull($token);
            $this->assertEquals($token['user_id'], $token->user_id);
        }
    }

    // by not revoked
    public function testNotRevoked(): void
    {
        $query = UserRefreshToken::find()->notRevoked()->all();

        foreach ($query as $token) {
            $this->assertNotNull($token);
            $this->assertNull($token->revoked_at);
        }
    }

    // chaining test
    public function testQueryChainingWithValidToken(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'valid_token');

        $query = UserRefreshToken::find()
            ->byUserId($token['user_id'])
            ->byIp($token['ip'])
            ->notExpired()
            ->notRevoked()
            ->one();

        $this->assertNotNull($query);
        $this->assertEquals($token['user_id'], $query->user_id);
        $this->assertEquals($token['ip'], $query->ip);
        $this->assertGreaterThan(time(), $query->expires_at);
        $this->assertNull($query->revoked_at);
    }

    public function testQueryChainingWithExpiredToken(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'expired_token');

        $baseQuery = UserRefreshToken::find()
            ->byUserId($token['user_id'])
            ->byIp($token['ip']);

        $query = clone $baseQuery;
        $res = $query->notExpired()->one();

        $this->assertNotNull($baseQuery->one(), 'Expected base query to return the token'); // base query should still return the token
        $this->assertNull($res, 'Expected notExpired() to return null for an expired token');
    }

    public function testQueryChainingWithRevokedToken(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'revoked_token');

        $baseQuery = UserRefreshToken::find()
            ->byUserId($token['user_id'])
            ->byIp($token['ip']);

        $query = clone $baseQuery;
        $res = $query->notRevoked()->one();

        $this->assertNotNull($baseQuery->one(), 'Expected base query to return the token'); // base query should still return the token
        $this->assertNull($res, 'Expected notRevoked() to return null for a revoked token');
    }

    public function testQueryChainingWithExpiredAndRevokedToken(): void
    {
        $token = $this->tester->grabFixture('user_refresh_token', 'revoked_expired_token');

        $baseQuery = UserRefreshToken::find()
            ->byUserId($token['user_id'])
            ->byIp($token['ip']);

        $notExpiredQuery = clone $baseQuery;
        $notExpiredRes = $notExpiredQuery->notExpired()->one();

        $notRevokedQuery = clone $baseQuery;
        $notRevokedRes = $notRevokedQuery->notRevoked()->one();

        $this->assertNull($notExpiredRes, 'Expected notExpired() to return null for an expired token');
        $this->assertNull($notRevokedRes, 'Expected notRevoked() to return null for a revoked token');
        $this->assertNotNull($baseQuery->one(), 'Expected base query to return the token');
    }
}
