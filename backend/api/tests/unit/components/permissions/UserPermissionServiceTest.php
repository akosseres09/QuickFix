<?php

namespace api\tests\unit\components\permissions;

use api\components\permissions\UserPermissionService;
use Codeception\Test\Unit;
use api\tests\UnitTester;
use common\fixtures\UserFixture;
use common\models\User;
use Yii;

class UserPermissionServiceTest extends Unit
{
    protected UnitTester $tester;

    private const USER1_ID = '01900000-0000-7000-8000-000000000001';
    private const USER2_ID = '01900000-0000-7000-8000-000000000002';
    private const USER3_ID = '01900000-0000-7000-8000-000000000003'; // admin user (is_admin = ADMIN)

    public function _fixtures(): array
    {
        return [
            'users' => UserFixture::class,
        ];
    }

    // -------------------------------------------------------------------------
    // canUpdateUser
    // -------------------------------------------------------------------------

    public function testCanUpdateSelf()
    {
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $this->assertTrue(UserPermissionService::canUpdateUser(self::USER1_ID, self::USER1_ID));
    }

    public function testCannotUpdateOtherUserAsRegularUser()
    {
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $this->assertFalse(UserPermissionService::canUpdateUser(self::USER2_ID, self::USER1_ID));
    }

    public function testAdminCanUpdateOtherUser()
    {
        $admin = User::findOne(self::USER3_ID);
        Yii::$app->user->setIdentity($admin);

        $this->assertTrue(UserPermissionService::canUpdateUser(self::USER1_ID, self::USER3_ID));
    }

    // -------------------------------------------------------------------------
    // canDeleteUser
    // -------------------------------------------------------------------------

    public function testCanDeleteSelf()
    {
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $this->assertTrue(UserPermissionService::canDeleteUser(self::USER1_ID, self::USER1_ID));
    }

    public function testCannotDeleteOtherUserAsRegularUser()
    {
        $user = User::findOne(self::USER1_ID);
        Yii::$app->user->setIdentity($user);

        $this->assertFalse(UserPermissionService::canDeleteUser(self::USER2_ID, self::USER1_ID));
    }

    public function testAdminCanDeleteOtherUser()
    {
        $admin = User::findOne(self::USER3_ID);
        Yii::$app->user->setIdentity($admin);

        $this->assertTrue(UserPermissionService::canDeleteUser(self::USER1_ID, self::USER3_ID));
    }
}
