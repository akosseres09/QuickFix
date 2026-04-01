<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\UserFixture;
use common\models\User;
use common\models\UserRole;
use common\models\UserStatus;

class UserQueryTest extends Unit
{
    protected $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class'    => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // active / inactive / deleted
    // -------------------------------------------------------------------------

    public function testActiveReturnsOnlyActiveUsers(): void
    {
        $results = User::find()->active()->all();

        // bayer.hudson and admin.user are ACTIVE
        verify(count($results))->equals(2);
        foreach ($results as $user) {
            verify($user->status)->equals(UserStatus::ACTIVE->value);
        }
    }

    public function testInactiveReturnsOnlyInactiveUsers(): void
    {
        $results = User::find()->inactive()->all();

        verify(count($results))->equals(1);
        verify($results[0]->username)->equals('jane.doe');
    }

    public function testDeletedReturnsOnlyDeletedUsers(): void
    {
        $results = User::find()->deleted()->all();

        verify(count($results))->equals(1);
        verify($results[0]->username)->equals('deleted.user');
    }

    // -------------------------------------------------------------------------
    // admin / user
    // -------------------------------------------------------------------------

    public function testAdminReturnsOnlyAdminUsers(): void
    {
        $results = User::find()->admin()->all();

        verify(count($results))->equals(1);
        verify($results[0]->username)->equals('admin.user');
        verify($results[0]->is_admin)->equals(UserRole::ADMIN->value);
    }

    public function testUserReturnsOnlyNonAdminUsers(): void
    {
        $results = User::find()->user()->all();

        // bayer.hudson, jane.doe, deleted.user are all non-admin
        verify(count($results))->equals(3);
        foreach ($results as $user) {
            verify($user->is_admin)->equals(UserRole::USER->value);
        }
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingUser(): void
    {
        $result = User::find()
            ->byId('01900000-0000-0000-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->username)->equals('bayer.hudson');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = User::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byEmail
    // -------------------------------------------------------------------------

    public function testByEmailReturnsMatchingUser(): void
    {
        $result = User::find()
            ->byEmail('nicole.paucek@schultz.info')
            ->one();

        verify($result)->notNull();
        verify($result->username)->equals('bayer.hudson');
    }

    public function testByEmailReturnsNullForUnknownEmail(): void
    {
        $result = User::find()
            ->byEmail('unknown@example.com')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byEmailVerificationToken
    // -------------------------------------------------------------------------

    public function testByEmailVerificationTokenReturnsMatchingUser(): void
    {
        // Only jane.doe has a verification token in the fixture
        $result = User::find()
            ->byEmailVerificationToken('testVerificationToken22222222222222222222')
            ->one();

        verify($result)->notNull();
        verify($result->username)->equals('jane.doe');
    }

    public function testByEmailVerificationTokenReturnsNullForUnknownToken(): void
    {
        $result = User::find()
            ->byEmailVerificationToken('nonexistent-token')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byUsername
    // -------------------------------------------------------------------------

    public function testByUsernameReturnsMatchingUser(): void
    {
        $result = User::find()
            ->byUsername('admin.user')
            ->one();

        verify($result)->notNull();
        verify($result->is_admin)->equals(UserRole::ADMIN->value);
    }

    public function testByUsernameReturnsNullForUnknownUsername(): void
    {
        $result = User::find()
            ->byUsername('no.such.user')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingActiveAndAdmin(): void
    {
        $results = User::find()->active()->admin()->all();

        verify(count($results))->equals(1);
        verify($results[0]->username)->equals('admin.user');
    }

    public function testChainingActiveAndUser(): void
    {
        // active + non-admin → only bayer.hudson
        $results = User::find()->active()->user()->all();

        verify(count($results))->equals(1);
        verify($results[0]->username)->equals('bayer.hudson');
    }
}
