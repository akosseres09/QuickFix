<?php

namespace common\tests\unit\models\forms;

use Codeception\Test\Unit;
use common\fixtures\UserFixture;
use common\models\forms\ResetPasswordForm;
use common\tests\UnitTester;
use Yii;

class ResetPasswordFormTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures()
    {
        return [
            'user' => [
                'class' => UserFixture::class,
                'dataFile' => __DIR__ . '/../../../_data/user.php',
            ],
        ];
    }

    public function testConstructWithEmptyToken()
    {
        $this->expectException(\yii\base\InvalidArgumentException::class);
        $this->expectExceptionMessage('Password reset token cannot be blank.');

        new ResetPasswordForm('');
    }

    public function testConstructWithInvalidToken()
    {
        $this->expectException(\yii\base\InvalidArgumentException::class);
        $this->expectExceptionMessage('Wrong password reset token.');

        new ResetPasswordForm('invalid-token');
    }

    public function testConstructWithValidToken()
    {
        $user = $this->tester->grabFixture('user', 0);
        $token = $user['password_reset_token'];

        $form = new ResetPasswordForm($token);
        verify($form)->instanceOf(ResetPasswordForm::class);
    }

    public function testInvalidPassword()
    {
        $user = $this->tester->grabFixture('user', 0);
        $token = $user['password_reset_token'];

        $form = new ResetPasswordForm($token);

        // Password is required
        $form->password = '';
        verify($form->validate())->false();
        verify($form->getErrors('password'))->arrayContains('Password cannot be blank.');
    }

    public function testShortPassword()
    {
        $user = $this->tester->grabFixture('user', 0);
        $token = $user['password_reset_token'];

        $form = new ResetPasswordForm($token);

        // Password must be at least the minimum length
        $form->password = 'short';
        verify($form->validate())->false();
        verify($form->getErrors('password'))->arrayContains('Password should contain at least 6 characters.');
    }

    public function testValidPassword()
    {
        $user = $this->tester->grabFixture('user', 0);
        $token = $user['password_reset_token'];

        $form = new ResetPasswordForm($token);

        // Valid password
        $form->password = 'validpassword';
        verify($form->validate())->true();
    }

    public function testSendEmail()
    {
        $user = $this->tester->grabFixture('user', 0);
        $token = $user['password_reset_token'];

        $form = new ResetPasswordForm($token);
        $form->password = 'newsecurepassword';

        verify($form->resetPassword())->true();

        // Verify that the user's password was updated
        $updatedUser = Yii::$app->db->createCommand('SELECT * FROM {{%user}} WHERE id=:id')
            ->bindValue(':id', $user['id'])
            ->queryOne();

        verify($updatedUser)->notEmpty();
        verify($updatedUser['password_hash'])->notEquals($user['password_hash']);
        verify($updatedUser['password_reset_token'])->null();
    }
}
