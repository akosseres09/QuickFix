<?php

namespace common\tests\unit\models\forms;

use common\fixtures\UserFixture;
use common\models\forms\SignupForm;
use Codeception\Test\Unit;
use common\models\User;
use Yii;
use yii\base\Event;

/**
 * Reference test for a Form model (yii\base\Model subclass).
 *
 * Demonstrates:
 * - Loading fixtures for validators that query the DB (unique rules)
 * - Testing required-field enforcement
 * - Testing field-format validators (email, min length)
 * - Testing cross-field validators (password confirmation)
 * - Testing uniqueness validators against fixture data
 * - Testing that valid data produces no errors
 *
 * Run with:
 *   vendor/bin/codecept run unit "unit/models/SignupFormTest" -c common/codeception.yml
 */
class SignupFormTest extends Unit
{
    /** @var \common\tests\UnitTester */
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
    // Required-field validation
    // -------------------------------------------------------------------------

    public function testEmptyFormFailsValidation(): void
    {
        $form = new SignupForm();

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('username');
        verify($form->errors)->arrayHasKey('email');
        verify($form->errors)->arrayHasKey('password');
        verify($form->errors)->arrayHasKey('confirm_password');
        verify($form->errors)->arrayHasKey('first_name');
        verify($form->errors)->arrayHasKey('last_name');
    }

    // -------------------------------------------------------------------------
    // Format validators
    // -------------------------------------------------------------------------

    public function testInvalidEmailFails(): void
    {
        $form = new SignupForm([
            'username'         => 'newuser',
            'email'            => 'not-an-email',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => 'secret123',
            'confirm_password' => 'secret123',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
    }

    public function testUsernameTooShortFails(): void
    {
        $form = new SignupForm([
            'username'         => 'usr',   // min is 5
            'email'            => 'new@example.com',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => 'secret123',
            'confirm_password' => 'secret123',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('username');
    }

    public function testPasswordTooShortFails(): void
    {
        $form = new SignupForm([
            'username'         => 'newuser',
            'email'            => 'new@example.com',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => '123',   // min is 6
            'confirm_password' => '123',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('password');
    }

    // -------------------------------------------------------------------------
    // Cross-field validator
    // -------------------------------------------------------------------------

    public function testPasswordMismatchFails(): void
    {
        $form = new SignupForm([
            'username'         => 'newuser',
            'email'            => 'new@example.com',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => 'secret123',
            'confirm_password' => 'different456',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('password');
    }

    // -------------------------------------------------------------------------
    // Unique validators (require DB / fixture)
    // -------------------------------------------------------------------------

    public function testDuplicateUsernameFailsUnique(): void
    {
        // 'bayer.hudson' exists in the user fixture
        $form = new SignupForm([
            'username'         => 'bayer.hudson',
            'email'            => 'unique@example.com',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => 'secret123',
            'confirm_password' => 'secret123',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('username');
    }

    public function testDuplicateEmailFailsUnique(): void
    {
        // 'nicole.paucek@schultz.info' exists in the user fixture
        $form = new SignupForm([
            'username'         => 'brandnewuser',
            'email'            => 'nicole.paucek@schultz.info',
            'first_name'       => 'Test',
            'last_name'        => 'User',
            'password'         => 'secret123',
            'confirm_password' => 'secret123',
        ]);

        verify($form->validate())->false();
        verify($form->errors)->arrayHasKey('email');
    }

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    public function testValidDataPassesValidation(): void
    {
        $form = new SignupForm([
            'username'         => 'brand.new.user',
            'email'            => 'brandnew@example.com',
            'first_name'       => 'Brand',
            'last_name'        => 'New',
            'password'         => 'secret123',
            'confirm_password' => 'secret123',
            'date_of_birth'    => '1990-06-15',
            'phone_number'     => '+1-555-0100',
        ]);

        verify($form->validate())->true();
        verify($form->errors)->empty();
    }

    // -------------------------------------------------------------------------
    // fields()
    // -------------------------------------------------------------------------

    public function testFields(): void
    {
        $form = new SignupForm([
            'username'   => 'testuser',
            'email'      => 'test@example.com',
            'first_name' => 'Test',
            'last_name'  => 'User',
        ]);

        $fields = $form->fields();
        verify($fields)->arrayContains('username');
        verify($fields)->arrayContains('email');
        verify($fields)->arrayHasKey('firstName');
        verify($fields)->arrayHasKey('lastName');
    }

    // -------------------------------------------------------------------------
    // signup()
    // -------------------------------------------------------------------------

    public function testSignupReturnsNullWhenInvalid(): void
    {
        $form = new SignupForm(); // empty — fails validation
        verify($form->signup())->null();
    }

    public function testSignupSuccess(): void
    {
        $form = new SignupForm([
            'username'         => 'new.signup.user',
            'email'            => 'newsignup@example.com',
            'first_name'       => 'New',
            'last_name'        => 'Signup',
            'password'         => 'password123',
            'confirm_password' => 'password123',
        ]);

        $result = $form->signup();
        verify($result)->true();
    }

    public function testSignupFailsWhenUserSaveFails(): void
    {
        $form = new SignupForm([
            'username'         => 'new.signup.user',
            'email'            => 'newsignup@example.com',
            'first_name'       => 'New',
            'last_name'        => 'Signup',
            'password'         => 'password123',
            'confirm_password' => 'password123',
        ]);

        Event::on(User::class, User::EVENT_BEFORE_INSERT, function (Event $event) {
            $event->isValid = false; // simulate save failure
        });

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/Failed to save user: /');
        $form->signup();
    }

    public function testSignupFailsWhenEmailSendFails(): void
    {
        $originalQueue = Yii::$app->get('queue');

        $fakeQueue = new class extends \yii\base\Component {
            public function push($job)
            {
                return null;
            }
        };

        // Inject our fake queue into the Yii2 application
        Yii::$app->set('queue', $fakeQueue);

        $form = new SignupForm([
            'username'         => 'new.signup.user',
            'email'            => 'newsignup@example.com',
            'first_name'       => 'New',
            'last_name'        => 'Signup',
            'password'         => 'password123',
            'confirm_password' => 'password123',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/Failed to send verification email to user: /');

        $form->signup();

        Yii::$app->set('queue', $originalQueue);
    }
}
