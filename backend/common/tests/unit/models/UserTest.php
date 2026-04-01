<?php

namespace common\tests\unit\models;

use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\IssueFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\ProjectMemberFixture;
use common\fixtures\LabelFixture;
use common\fixtures\UserFixture;
use common\models\User;
use common\models\UserRole;
use common\models\UserStatus;

class UserTest extends Unit
{
    protected $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class'    => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
            'organization' => [
                'class' => OrganizationFixture::class,
            ],
            'organization_member' => [
                'class' => OrganizationMemberFixture::class,
            ],
            'project' => [
                'class' => ProjectFixture::class,
            ],
            'project_member' => [
                'class' => ProjectMemberFixture::class,
            ],
            'label' => [
                'class' => LabelFixture::class,
            ],
            'issue' => [
                'class' => IssueFixture::class,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFieldsAreEnforced(): void
    {
        $user = new User();
        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('username');
        verify($user->errors)->arrayHasKey('email');
        verify($user->errors)->arrayHasKey('password_hash');
        verify($user->errors)->arrayHasKey('first_name');
        verify($user->errors)->arrayHasKey('last_name');
        verify($user->errors)->arrayHasKey('auth_key');
    }

    public function testEmailMustBeValid(): void
    {
        $user = new User([
            'username'      => 'testuser',
            'email'         => 'not-an-email',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'someauthkey1234567890123456789012',
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('email');
    }

    public function testEmailMaxLength(): void
    {
        $user = new User([
            'username'      => 'testuser',
            'email'         => str_repeat('a', 246) . '@test.com', // 255+ chars
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'someauthkey1234567890123456789012',
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('email');
    }

    public function testUniqueUsernameEnforced(): void
    {
        $user = new User([
            'username'      => 'bayer.hudson', // already exists in fixtures
            'email'         => 'new@example.com',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'uniqueauthkey12345678901234567890',
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('username');
    }

    public function testUniqueEmailEnforced(): void
    {
        $user = new User([
            'username'      => 'uniqueuser',
            'email'         => 'nicole.paucek@schultz.info', // already exists
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'someuniqauthk12345678901234567890',
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('email');
    }

    public function testDefaultValues(): void
    {
        $user = new User();
        $user->validate();

        verify($user->is_admin)->equals(UserRole::USER->value);
        verify($user->status)->equals(UserStatus::INACTIVE->value);
    }

    public function testIsAdminMustBeInRange(): void
    {
        $user = new User([
            'username'      => 'rangetest',
            'email'         => 'range@example.com',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'rangeauthkey12345678901234567890x',
            'is_admin'      => 99,
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('is_admin');
    }

    public function testStatusMustBeInRange(): void
    {
        $user = new User([
            'username'      => 'statustest',
            'email'         => 'status@example.com',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'statusauthk12345678901234567890xx',
            'status'        => 999,
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('status');
    }

    public function testDateOfBirthFormat(): void
    {
        $user = new User([
            'username'      => 'dobtest',
            'email'         => 'dob@example.com',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'dobauthkeyxx12345678901234567890',
            'date_of_birth' => 'not-a-date',
        ]);

        verify($user->validate())->false();
        verify($user->errors)->arrayHasKey('date_of_birth');
    }

    public function testValidDateOfBirthPasses(): void
    {
        $user = new User([
            'username'      => 'dobvalid',
            'email'         => 'dobvalid@example.com',
            'password_hash' => 'hash',
            'first_name'    => 'Test',
            'last_name'     => 'User',
            'auth_key'      => 'dobvalidauthk1234567890123456789',
            'date_of_birth' => '1995-06-15',
        ]);

        verify($user->validate())->true();
    }

    public function testValidDataPassesValidation(): void
    {
        $user = new User([
            'username'      => 'validuser',
            'email'         => 'valid@example.com',
            'password_hash' => 'some-hash',
            'first_name'    => 'Valid',
            'last_name'     => 'User',
            'auth_key'      => 'validauthkey12345678901234567890',
        ]);

        verify($user->validate())->true();
    }

    // -------------------------------------------------------------------------
    // beforeSave & UUID generation
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        $user = new User([
            'username'   => 'uuiduser',
            'email'      => 'uuid@example.com',
            'first_name' => 'UUID',
            'last_name'  => 'Test',
        ]);
        $user->setPassword('password_0');
        $user->generateAuthKey();

        $saved = $user->save();
        verify($saved)->true();
        verify($user->id)->notEmpty();
        verify($user->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    public function testSaveGeneratesProfilePictureUrl(): void
    {
        $user = new User([
            'username'   => 'picuser',
            'email'      => 'pic@example.com',
            'first_name' => 'Picture',
            'last_name'  => 'Test',
        ]);
        $user->setPassword('password_0');
        $user->generateAuthKey();
        $user->save();

        verify($user->profile_picture_url)->notEmpty();
        verify($user->profile_picture_url)->stringContainsString('ui-avatars.com');
    }

    // -------------------------------------------------------------------------
    // Password & authentication methods
    // -------------------------------------------------------------------------

    public function testSetPasswordAndValidate(): void
    {
        $user = new User();
        $user->setPassword('my_secure_password');

        verify($user->password_hash)->notEmpty();
        verify($user->validatePassword('my_secure_password'))->true();
        verify($user->validatePassword('wrong_password'))->false();
    }

    public function testGenerateAuthKey(): void
    {
        $user = new User();
        $user->generateAuthKey();

        verify($user->auth_key)->notEmpty();
        verify(strlen($user->auth_key))->equals(32);
    }

    public function testValidateAuthKey(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        verify($user->validateAuthKey('HP187Mvq7Mmm3CTU80dLkGmni_FUH_lR'))->true();
        verify($user->validateAuthKey('wrong_key'))->false();
    }

    public function testGeneratePasswordResetToken(): void
    {
        $user = new User();
        $user->generatePasswordResetToken();

        verify($user->password_reset_token)->notEmpty();
        verify($user->password_reset_token_expires_at)->greaterThan(time());
    }

    public function testIsPasswordResetTokenValidWithEmptyToken(): void
    {
        $user = new User();
        verify($user->isPasswordResetTokenValid())->false();
    }

    public function testIsPasswordResetTokenValidWithValidToken(): void
    {
        $user = new User();
        $user->password_reset_token = 'some_token';
        $user->password_reset_token_expires_at = time() + 3600;

        verify($user->isPasswordResetTokenValid())->true();
    }

    public function testIsPasswordResetTokenValidWithExpiredToken(): void
    {
        $user = new User();
        $user->password_reset_token = 'some_token';
        $user->password_reset_token_expires_at = time() - 1;

        verify($user->isPasswordResetTokenValid())->false();
    }

    public function testGenerateEmailVerificationToken(): void
    {
        $user = new User();
        $user->generateEmailVerificationToken();

        verify($user->verification_token)->notEmpty();
        verify($user->email_verification_token_expires_at)->greaterThan(time());
    }

    public function testIsEmailTokenExpired(): void
    {
        $user = new User();
        $user->email_verification_token_expires_at = time() - 1;
        verify($user->isEmailTokenExpired())->true();

        $user->email_verification_token_expires_at = time() + 3600;
        verify($user->isEmailTokenExpired())->false();
    }

    public function testRemoveEmailVerifyToken(): void
    {
        $user = new User();
        $user->verification_token = 'some_token';
        $user->email_verification_token_expires_at = time() + 3600;

        $user->removeEmailVerifyToken();

        verify($user->verification_token)->null();
        verify($user->email_verification_token_expires_at)->null();
    }

    public function testRemovePasswordResetToken(): void
    {
        $user = new User();
        $user->password_reset_token = 'some_token';
        $user->password_reset_token_expires_at = time() + 3600;

        $user->removePasswordResetToken();

        verify($user->password_reset_token)->null();
        verify($user->password_reset_token_expires_at)->null();
    }

    // -------------------------------------------------------------------------
    // Finder methods
    // -------------------------------------------------------------------------

    public function testFindIdentityReturnsActiveUser(): void
    {
        $user = User::findIdentity('01900000-0000-0000-0000-000000000001');
        verify($user)->notNull();
        verify($user->username)->equals('bayer.hudson');
    }

    public function testFindIdentityReturnsNullForInactiveUser(): void
    {
        $user = User::findIdentity('01900000-0000-0000-0000-000000000002');
        verify($user)->null();
    }

    public function testFindIdentityReturnsNullForDeletedUser(): void
    {
        $user = User::findIdentity('01900000-0000-0000-0000-000000000004');
        verify($user)->null();
    }

    public function testFindByUsernameReturnsActiveUser(): void
    {
        $user = User::findByUsername('bayer.hudson');
        verify($user)->notNull();
        verify($user->email)->equals('nicole.paucek@schultz.info');
    }

    public function testFindByUsernameReturnsNullForInactive(): void
    {
        $user = User::findByUsername('jane.doe');
        verify($user)->null();
    }

    public function testFindByUsernameReturnsNullForNonExisting(): void
    {
        $user = User::findByUsername('nonexistent');
        verify($user)->null();
    }

    public function testFindByEmailReturnsActiveUser(): void
    {
        $user = User::findByEmail('nicole.paucek@schultz.info');
        verify($user)->notNull();
        verify($user->username)->equals('bayer.hudson');
    }

    public function testFindByEmailReturnsNullForInactive(): void
    {
        $user = User::findByEmail('jane.doe@example.com');
        verify($user)->null();
    }

    public function testFindByPasswordResetToken(): void
    {
        $user = User::findByPasswordResetToken('ExzkCOaYc1L8IOBs4wdTGGbgNiG3Wz1I_1402312317');
        verify($user)->notNull();
        verify($user->username)->equals('bayer.hudson');
    }

    public function testFindByPasswordResetTokenReturnsNullForInactive(): void
    {
        // jane.doe is inactive, so even though she has a token, should not be found
        $user = User::findByPasswordResetToken('ExzkCOaYc1L8IOBs4wdTGGbgNiG3Wz1I_1402312318');
        verify($user)->null();
    }

    public function testFindByVerificationToken(): void
    {
        $user = User::findByVerificationToken('testVerificationToken22222222222222222222');
        verify($user)->notNull();
        verify($user->username)->equals('jane.doe');
    }

    // -------------------------------------------------------------------------
    // Computed properties
    // -------------------------------------------------------------------------

    public function testGetFullName(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        verify($user->getFullName())->equals('Bayer Hudson');
    }

    public function testGetRole(): void
    {
        $activeUser = User::findOne(['username' => 'bayer.hudson']);
        verify($activeUser->getRole())->equals(UserRole::USER);

        $adminUser = User::findOne(['username' => 'admin.user']);
        verify($adminUser->getRole())->equals(UserRole::ADMIN);
    }

    public function testIsActive(): void
    {
        $activeUser = User::findOne(['username' => 'bayer.hudson']);
        verify($activeUser->isActive())->true();

        $inactiveUser = User::findOne(['username' => 'jane.doe']);
        verify($inactiveUser->isActive())->false();

        $deletedUser = User::findOne(['username' => 'deleted.user']);
        verify($deletedUser->isActive())->false();
    }

    public function testGenerateProfilePictureUrl(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $url = $user->generateProfilePictureUrl();

        verify($url)->stringContainsString('ui-avatars.com');
        verify($url)->stringContainsString(urlencode($user->getFullName()));
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetOrganizations(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $orgs = $user->organizations;

        verify($orgs)->notEmpty();
    }

    public function testGetOrganizationMemberships(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $memberships = $user->organizationMemberships;

        verify($memberships)->notEmpty();
    }

    public function testGetProjects(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $projects = $user->projects;

        verify($projects)->notEmpty();
    }

    public function testGetProjectMemberships(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $memberships = $user->projectMemberships;

        verify($memberships)->notEmpty();
    }

    public function testGetCreatedIssues(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $issues = $user->createdIssues;

        verify($issues)->notEmpty();
    }

    public function testGetAssignedIssues(): void
    {
        $user = User::findOne(['username' => 'jane.doe']);
        $issues = $user->assignedIssues;

        verify($issues)->notEmpty();
    }

    public function testFieldsDefaultScenario(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $fields = $user->fields();

        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('username');
        verify($fields)->arrayContains('email');
        verify($fields)->arrayContains('status');

        verify($fields)->arrayHasKey('isAdmin');
        verify($fields)->arrayContains('is_admin');

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');

        verify($fields)->arrayHasKey('firstName');
        verify($fields)->arrayContains('first_name');

        verify($fields)->arrayHasKey('lastName');
        verify($fields)->arrayContains('last_name');

        verify($fields)->arrayHasKey('phoneNumber');
        verify($fields)->arrayContains('phone_number');

        verify($fields)->arrayHasKey('dateOfBirth');
        verify($fields)->arrayContains('date_of_birth');

        verify($fields)->arrayHasKey('profilePictureUrl');
        verify($fields)->arrayContains('profile_picture_url');

        verify($fields)->arrayHasKey('fullName');
        verify($fields['fullName'])->isCallable();
    }

    public function testFieldsNotDefaultScenario(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $user->scenario = 'update';
        $fields = $user->fields();

        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('username');
        verify($fields)->arrayContains('email');
        verify($fields)->arrayContains('status');

        verify($fields)->arrayHasKey('isAdmin');
        verify($fields)->arrayContains('is_admin');

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');

        verify($fields)->arrayHasKey('firstName');
        verify($fields)->arrayContains('first_name');

        verify($fields)->arrayHasKey('lastName');
        verify($fields)->arrayContains('last_name');

        verify($fields)->arrayHasKey('phoneNumber');
        verify($fields)->arrayContains('phone_number');

        verify($fields)->arrayHasKey('dateOfBirth');
        verify($fields)->arrayContains('date_of_birth');

        verify($fields)->arrayHasKey('profilePictureUrl');
        verify($fields)->arrayContains('profile_picture_url');

        verify($fields)->arrayHasKey('fullName');
        verify($fields['fullName'])->isCallable();

        verify($fields)->arrayHasKey('passwordHash');
        verify($fields)->arrayContains('password_hash');
    }

    // -------------------------------------------------------------------------
    // DB round-trip
    // -------------------------------------------------------------------------

    public function testFindAndVerifyFixtureData(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        verify($user)->notNull();
        verify($user->status)->equals(UserStatus::ACTIVE->value);
        verify($user->is_admin)->equals(UserRole::USER->value);
        verify($user->deleted_at)->null();

        $admin = User::findOne(['username' => 'admin.user']);
        verify($admin)->notNull();
        verify($admin->is_admin)->equals(UserRole::ADMIN->value);
        verify($admin->status)->equals(UserStatus::ACTIVE->value);
    }

    // -------------------------------------------------------------------------
    // Identity / cache helpers
    // -------------------------------------------------------------------------

    public function testGetId(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        verify($user->getId())->equals('01900000-0000-0000-0000-000000000001');
    }

    public function testGetEmailToken(): void
    {
        $user = User::findOne(['username' => 'jane.doe']);
        verify($user->getEmailToken())->equals('testVerificationToken22222222222222222222');
    }

    public function testGetRefreshTokens(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        verify($user->refreshTokens)->isArray();
    }

    public function testGetUsernameToIdCache(): void
    {
        $key = User::getUsernameToIdCache('bayer.hudson');
        verify($key)->equals('username_to_id_bayer.hudson');
    }

    public function testSetProfilePictureUrl(): void
    {
        $user = new User(['first_name' => 'Test', 'last_name' => 'User']);
        $user->setProfilePictureUrl();
        verify($user->profile_picture_url)->stringContainsString('ui-avatars.com');
    }

    public function testFindIdentityByAccessTokenWithInvalidToken(): void
    {
        $user = User::findIdentityByAccessToken('this-is-not-a-valid-jwt-token');
        verify($user)->null();
    }
}
