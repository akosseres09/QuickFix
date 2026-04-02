<?php

namespace api\tests\unit\models;

use api\models\UserRefreshToken;
use api\tests\UnitTester;
use Codeception\Test\Unit;
use common\fixtures\UserRefreshTokenFixture;
use common\models\User;
use Symfony\Component\Uid\Uuid;
use yii\behaviors\TimestampBehavior;

class UserRefreshTokenTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'user_refresh_token' => UserRefreshTokenFixture::class
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

    // Table name is correct
    public function testTableName(): void
    {
        $this->assertSame('{{%user_refresh_token}}', UserRefreshToken::tableName());
    }

    // Validation rules
    public function testRequiredFields(): void
    {
        $model = new UserRefreshToken();
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('user_id', $model->errors);
        $this->assertContains('User ID cannot be blank.', $model->getErrors('user_id'));
        $this->assertArrayHasKey('token', $model->errors);
        $this->assertContains('Token cannot be blank.', $model->getErrors('token'));
        $this->assertArrayHasKey('expires_at', $model->errors);
        $this->assertContains('Expires At cannot be blank.', $model->getErrors('expires_at'));
    }

    public function testUserIdMaxLength(): void
    {
        $model = new UserRefreshToken([
            'user_id' => str_repeat('a', 37), // 37 chars, exceeds max of 36
        ]);
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('user_id', $model->errors);
        $this->assertContains('User ID should contain at most 36 characters.', $model->getErrors('user_id'));
    }

    public function testTimestampsShouldBeIntegers(): void
    {
        $model = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => 'test-token',
            'expires_at' => 'not-an-integer',
            'created_at' => 'also-not-an-integer',
        ]);
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('expires_at', $model->errors);
        $this->assertContains('Expires At must be an integer.', $model->getErrors('expires_at'));
        $this->assertArrayHasKey('created_at', $model->errors);
        $this->assertContains('Created At must be an integer.', $model->getErrors('created_at'));
    }

    public function testIpAddressMaxLength(): void
    {
        $model = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => 'test-token',
            'expires_at' => time() + 3600,
            'ip' => str_repeat('1', 46), // 46 chars, exceeds max of 45
        ]);
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('ip', $model->errors);
        $this->assertContains('IP Address should contain at most 45 characters.', $model->getErrors('ip'));
    }

    public function testTokenMustBeUnique(): void
    {
        $existingToken = $this->tester->grabFixture('user_refresh_token', 'valid_token');
        $model = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => $existingToken['token'], // duplicate token
            'expires_at' => time() + 3600,
        ]);
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('token', $model->errors);
        $this->assertContains('Token "' . $existingToken['token'] . '" has already been taken.', $model->getErrors('token'));
    }

    public function testUserAgentMustBeString(): void
    {
        $model = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => 'test-token',
            'expires_at' => time() + 3600,
            'user_agent' => ['not', 'a', 'string'], // invalid user agent
        ]);
        $this->assertFalse($model->validate());
        $this->assertArrayHasKey('user_agent', $model->errors);
        $this->assertContains('User Agent must be a string.', $model->getErrors('user_agent'));
    }

    // attribute labels
    public function testAttributeLabelsAreSet(): void
    {
        $model = new UserRefreshToken();
        $labels = $model->attributeLabels();

        $this->assertArrayHasKey('id', $labels);
        $this->assertSame('ID', $labels['id']);

        $this->assertArrayHasKey('user_id', $labels);
        $this->assertSame('User ID', $labels['user_id']);

        $this->assertArrayHasKey('token', $labels);
        $this->assertSame('Token', $labels['token']);

        $this->assertArrayHasKey('ip', $labels);
        $this->assertSame('IP Address', $labels['ip']);

        $this->assertArrayHasKey('user_agent', $labels);
        $this->assertSame('User Agent', $labels['user_agent']);

        $this->assertArrayHasKey('created_at', $labels);
        $this->assertSame('Created At', $labels['created_at']);

        $this->assertArrayHasKey('expires_at', $labels);
        $this->assertSame('Expires At', $labels['expires_at']);

        $this->assertArrayHasKey('revoked_at', $labels);
        $this->assertSame('Revoked At', $labels['revoked_at']);
    }

    // behaviors
    public function testTimestampBehaviorIsSet(): void
    {
        $model = new UserRefreshToken();
        $behaviors = $model->behaviors();

        $this->assertArrayHasKey('timestamp', $behaviors);
        $this->assertSame(TimestampBehavior::class, $behaviors['timestamp']['class']);
        $this->assertSame('created_at', $behaviors['timestamp']['createdAtAttribute']);
        $this->assertFalse($behaviors['timestamp']['updatedAtAttribute']);
    }

    // beforeSave
    public function testBeforeSaveFailsWhenParentBeforeSaveFails(): void
    {
        $token = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => 'test-token',
            'expires_at' => time() + 3600,
        ]);

        $token->on(UserRefreshToken::EVENT_BEFORE_INSERT, function ($event) {
            $event->isValid = false; // Simulate parent beforeSave failure
        });

        $this->assertFalse($token->save());

        $token->off(UserRefreshToken::EVENT_BEFORE_INSERT); // Remove the event handler to avoid affecting other tests
    }

    public function testBeforeSaveReturnsEarlyIfNotInserting(): void
    {
        $token = UserRefreshToken::findOne(['token' => 'valid-refresh-token-000000000000']);
        $tokenIpBefore = $token->ip;
        $token->ip = '127.0.0.2';
        $this->assertTrue($token->save());
        $token->refresh();

        $this->assertSame($token->ip, '127.0.0.2');
        $this->assertNotSame($token->ip, $tokenIpBefore); // IP should have been updated
    }

    public function testBeforeSaveGeneratesIdOnInsert(): void
    {
        $token = new UserRefreshToken([
            'user_id' => '01900000-0000-7000-8000-000000000001',
            'token' => 'new-test-token',
            'expires_at' => time() + 3600,
        ]);

        $this->assertTrue($token->save(), 'Failed to save new UserRefreshToken');
        $this->assertNotEmpty($token->id, 'ID should be generated on insert');
        $this->assertTrue(Uuid::isValid($token->id), 'Generated ID should be a valid UUID');
    }

    // relations
    public function testUserRelationIsSet(): void
    {
        $token = UserRefreshToken::findOne(['token' => 'valid-refresh-token-000000000000']);
        $user = $token->user;
        $this->assertInstanceOf(User::class, $user);
        $this->assertSame('01900000-0000-7000-8000-000000000001', $user->id);
    }

    // getters and methods
    public function testIsValidReturnsTrueForValidToken(): void
    {
        $fixture = $this->tester->grabFixture('user_refresh_token', 'valid_token');
        $token = UserRefreshToken::findOne(['token' => $fixture['token']]);
        $this->assertTrue($token->isValid());
    }

    public function testIsRevokedReturnsTrueForRevokedToken(): void
    {
        $fixture = $this->tester->grabFixture('user_refresh_token', 'revoked_token');
        $token = UserRefreshToken::findOne(['token' => $fixture['token']]);
        $this->assertTrue($token->isRevoked());
    }
}
