<?php

namespace common\tests\unit\models\forms;

use common\fixtures\UserFixture;
use common\models\forms\SignupForm;
use Codeception\Test\Unit;

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
}
