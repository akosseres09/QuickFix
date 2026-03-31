<?php

namespace backend\common\tests\unit\models\forms;

use Codeception\Test\Unit;
use common\fixtures\UserFixture;
use common\models\forms\VerifyEmailForm;
use common\models\User;
use common\models\UserStatus;
use common\tests\UnitTester;
use Yii;

class VerifyEmailFormTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures()
    {
        return [
            'user' => [
                'class' => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
        ];
    }

    public function testVerifyEmail()
    {
        $user = $this->tester->grabFixture('user', 1);
        $token = $user['verification_token'];

        $form = new VerifyEmailForm($token);

        verify($form->verifyEmail())->instanceOf(User::class);

        $newUser = Yii::$app->db->createCommand('SELECT * FROM {{%user}} WHERE id = :id', [':id' => $user['id']])->queryOne();
        verify($user['status'])->notEquals($newUser['status']);
        verify($newUser['status'])->equals(UserStatus::ACTIVE->value);
    }

    public function testInvalidToken()
    {
        $this->expectException(\yii\base\InvalidArgumentException::class);
        $this->expectExceptionMessage('Wrong verify email token.');
        $form = new VerifyEmailForm('invalid-token');
    }
}
