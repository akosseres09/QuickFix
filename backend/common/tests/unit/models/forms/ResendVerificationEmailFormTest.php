<?php

namespace backend\common\tests\unit\models\forms;

use Codeception\Test\Unit;
use common\models\forms\ResendVerificationEmailForm;
use common\tests\UnitTester;

class ResendVerificationEmailFormTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class' => \common\fixtures\UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php'
            ]
        ];
    }

    public function testTrimValidation()
    {
        $form = new ResendVerificationEmailForm([
            'email' => '  '
        ]);


        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
        verify($form->getErrors('email'))->arrayContains('Email cannot be blank.');
    }

    public function testRequiredValidation()
    {
        $form = new ResendVerificationEmailForm([
            'email' => null
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
        verify($form->getErrors('email'))->arrayContains('Email cannot be blank.');
    }

    public function testEmailValidation()
    {
        $form = new ResendVerificationEmailForm([
            'email' => 'invalid-email'
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
        verify($form->getErrors('email'))->arrayContains('Email is not a valid email address.');
    }

    public function testEmailNotFound()
    {
        $form = new ResendVerificationEmailForm([
            'email' => 'valid@example.com'
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
        verify($form->getErrors('email'))->arrayContains('There is no user with this email address.');
    }

    public function testExistingEmail()
    {
        $user = $this->tester->grabFixture('user', 0);
        $form = new ResendVerificationEmailForm([
            'email' => $user['email']
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
    }
}
