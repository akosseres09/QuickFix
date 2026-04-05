<?php

namespace backend\common\tests\unit\models\forms;

use Codeception\Test\Unit;
use common\models\forms\ResendVerificationEmailForm;
use common\models\User;
use common\tests\UnitTester;
use yii\base\Event;

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

    public function testSendWithUserPassedDirectly(): void
    {
        // jane.doe is INACTIVE and has a verification token
        $user = User::findOne(['username' => 'jane.doe']);
        $form = new ResendVerificationEmailForm(['email' => 'jane.doe@example.com']);

        $result = $form->send($user);
        verify($result)->true();
    }

    public function testSendEmailFailsWhenUserNotFound(): void
    {
        $form = new ResendVerificationEmailForm(['email' => 'nonexistent@example.com']);
        $result = $form->send();
        verify($result)->false();
    }

    public function testSendSucceedsWhenUserIsNullButFoundInDb(): void
    {
        $form = new ResendVerificationEmailForm([
            'email' => 'jane.doe@example.com' // inactive user
        ]);

        // 1. Method runs.
        // 2. $user === null is true, queries DB.
        // 3. findOne() succeeds.
        // 4. if (!$user) is skipped.
        // 5. User saves and email queues successfully.
        verify($form->send())->true();
    }

    public function testSendFailsWhenUserCannotBeSaved(): void
    {
        $form = new ResendVerificationEmailForm([
            'email' => 'jane.doe@example.com' // inactive user
        ]);

        // The Trap: Block the save!
        Event::on(User::class, User::EVENT_BEFORE_UPDATE, function ($event) {
            $event->isValid = false;
        });

        // 1. $user === null is true, DB queried.
        // 2. findOne() succeeds.
        // 3. Tokens are generated.
        // 4. $user->save() is called, but our trap returns false.
        // 5. if (!$saved) triggers and returns false.
        verify($form->send())->false();

        // Cleanup: Remove the trap so other tests don't break!
        Event::off(User::class, User::EVENT_BEFORE_UPDATE);
    }
}
