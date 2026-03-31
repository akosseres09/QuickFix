<?php

namespace common\tests\unit\models;

use api\components\permissions\RoleManager;
use common\fixtures\OrganizationFixture;
use common\fixtures\OrganizationMemberFixture;
use common\fixtures\UserFixture;
use common\models\Organization;
use common\models\OrganizationMember;
use common\models\User;
use Codeception\Test\Unit;
use Yii;

/**
 * Reference test for an ActiveRecord model.
 *
 * Demonstrates:
 * - Loading fixtures with dependencies
 * - Testing validation rules (required fields, max length)
 * - Testing a beforeSave hook (UUID generation)
 * - Doing a full DB round-trip (save / find / delete)
 * - Setting a Yii identity for tests that need an authenticated user
 *   (required by BlameableBehavior, which sets owner_id from the current user)
 *
 * Run with:
 *   vendor/bin/codecept run unit "unit/models/OrganizationTest" -c common/codeception.yml
 */
class OrganizationTest extends Unit
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
            'organization' => [
                'class' => OrganizationFixture::class,
            ],
            // Included so the table is present and gets cleaned up after save tests.
            'organization_member' => [
                'class' => OrganizationMemberFixture::class,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Log in the first fixture user so BlameableBehavior can resolve owner_id. */
    private function loginFixtureUser(): User
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        Yii::$app->user->setIdentity($user);

        return $user;
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testRequiredFieldsAreEnforced(): void
    {
        $org = new Organization();

        verify($org->validate())->false();
        verify($org->errors)->arrayHasKey('name');
        verify($org->errors)->arrayHasKey('slug');
    }

    public function testSlugOverMaxLengthFails(): void
    {
        $org = new Organization([
            'name' => 'My Organization',
            'slug' => str_repeat('x', 17), // max is 16
        ]);

        // owner_id is set manually so the FK validator passes; the slug rule
        // must still produce an error.
        $org->owner_id = '01900000-0000-0000-0000-000000000001';

        verify($org->validate())->false();
        verify($org->errors)->arrayHasKey('slug');
    }

    public function testDuplicateNameFailsUnique(): void
    {
        // 'Test Organization' already exists in the organization fixture
        $org = new Organization([
            'name'     => 'Test Organization',
            'slug'     => 'unique-slug',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($org->validate())->false();
        verify($org->errors)->arrayHasKey('name');
    }

    public function testValidDataPassesValidation(): void
    {
        $org = new Organization([
            'name'     => 'Another Organization',
            'slug'     => 'another-org',
            'owner_id' => '01900000-0000-0000-0000-000000000001',
        ]);

        verify($org->validate())->true();
        verify($org->errors)->empty();
    }

    // -------------------------------------------------------------------------
    // beforeSave hook & DB round-trip
    // -------------------------------------------------------------------------

    public function testSaveGeneratesUuid(): void
    {
        // BlameableBehavior sets owner_id from the current Yii user on insert.
        $this->loginFixtureUser();

        $org = new Organization([
            'name' => 'Save Test Org',
            'slug' => 'save-test',
        ]);

        $saved = $org->save();
        verify($saved)->true();

        // id must be a UUID v7 string generated in beforeSave
        verify($org->id)->notEmpty();
        verify($org->id)->stringMatchesRegExp(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'
        );
    }

    public function testSaveCreatesOwnerMembership(): void
    {
        $user = $this->loginFixtureUser();

        $org = new Organization([
            'name' => 'Membership Test Org',
            'slug' => 'membership-test',
        ]);
        $org->save();

        // Organization::afterSave creates an OrganizationMember for the owner.
        $member = OrganizationMember::findOne([
            'organization_id' => $org->id,
            'user_id'         => $user->id,
        ]);

        verify($member)->notNull();
        verify($member->role)->equals(RoleManager::ROLE_OWNER);
    }

    public function testFindAndDeleteOrganization(): void
    {
        // The fixture pre-loaded this organization.
        $org = Organization::findOne(['slug' => 'test-org']);

        verify($org)->notNull();
        verify($org->name)->equals('Test Organization');

        // Soft-delete check: the fixture row has no deleted_at, so it should be found.
        verify($org->deleted_at)->null();
    }
}
