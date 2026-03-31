<?php

namespace common\tests\unit\models\forms;

use Codeception\Test\Unit;
use common\fixtures\UserFixture;
use common\models\forms\PasswordResetRequestForm;
use common\tests\UnitTester;
use Yii;

class PasswordResetRequestFormTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class' => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php'
            ]
        ];
    }

    public function testNoEmail()
    {
        $model = new PasswordResetRequestForm([
            'email' => null
        ]);

        verify($model->validate())->false();
        verify($model->errors)->arrayHasKey('email');
        verify($model->getErrors('email'))->arrayContains('Email cannot be blank.');
    }

    public function testTrimEmail()
    {
        $model = new PasswordResetRequestForm([
            'email' => '  '
        ]);

        verify($model->validate())->false();
        verify($model->errors)->arrayHasKey('email');
        verify($model->getErrors('email'))->arrayContains('Email cannot be blank.');
    }

    public function testInvalidEmail()
    {
        $model = new PasswordResetRequestForm([
            'email' => 'not-an-email'
        ]);

        verify($model->validate())->false();
        verify($model->errors)->arrayHasKey('email');
        verify($model->getErrors('email'))->arrayContains('Email is not a valid email address.');
    }

    public function testEmailNotFound()
    {
        $model = new PasswordResetRequestForm([
            'email' => 'nonexistent@example.com'
        ]);

        verify($model->validate())->false();
        verify($model->errors)->arrayHasKey('email');
        verify($model->getErrors('email'))->arrayContains('There is no user with this email address.');
    }

    public function testEmailValidAndFound()
    {
        $user = $this->tester->grabFixture('user', 0);
        $model = new PasswordResetRequestForm([
            'email' => $user['email']
        ]);

        // Use an email from the fixture data to ensure it exists in the test database.
        verify($model->validate())->true();
        verify($model->errors)->arrayHasNotKey('email');
    }

    public function testSendEmail()
    {
        $user = $this->tester->grabFixture('user', 0);

        $model = new PasswordResetRequestForm([
            'email' => $user['email']
        ]);

        $resetTokenBefore = $user['password_reset_token'];

        verify($model->validate())->true();
        verify($model->sendEmail())->true();

        $newResetToken = Yii::$app->db->createCommand('SELECT password_reset_token FROM {{%user}} WHERE id = :id')
            ->bindValue(':id', $user['id'])
            ->queryScalar();

        verify($newResetToken)->notEmpty();
        verify($newResetToken)->notEquals($resetTokenBefore);
    }
}
