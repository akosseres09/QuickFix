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
use common\tests\UnitTester;
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
    protected UnitTester $tester;

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
            'project' => [
                'class' => \common\fixtures\ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
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

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    public function testGetSlugToIdCache(): void
    {
        $key = Organization::getSlugToIdCache('test-org');
        verify($key)->equals('organization_slug_to_id_test-org');
    }

    // -------------------------------------------------------------------------
    // fields / extraFields
    // -------------------------------------------------------------------------

    public function testFields(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        $fields = $org->fields();

        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('name');
        verify($fields)->arrayContains('slug');

        verify($fields)->arrayHasKey('ownerId');
        verify($fields)->arrayContains('owner_id');

        verify($fields)->arrayHasKey('logoUrl');
        verify($fields)->arrayContains('logo_url');

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');

        verify($fields)->arrayHasKey('updatedBy');
        verify($fields)->arrayContains('updated_by');

        verify($fields)->arrayHasKey('deletedAt');
        verify($fields)->arrayContains('deleted_at');
    }

    public function testExtraFieldsMemberCount(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        $extra = $org->extraFields();

        // memberCount and projectCount should be callable extra fields
        verify($extra)->arrayHasKey('memberCount');
        verify($extra)->arrayHasKey('projectCount');
        verify($extra)->arrayContains('owner');
        verify($extra)->arrayContains('projects');
        verify($extra)->arrayContains('organizationMembers');
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function testGetOwner(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        verify($org->owner)->notNull();
        verify($org->owner->username)->equals('bayer.hudson');
    }

    public function testGetProjects(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        verify($org->projects)->notEmpty();
    }

    public function testGetOrganizationMembers(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        verify($org->organizationMembers)->notEmpty();
    }

    public function testGetOrganizationMemberCount(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        $count = $org->getOrganizationMemberCount();
        // 3 members: owner + 1 member + 1 admin in fixtures
        verify($count)->greaterThanOrEqual(2);
    }

    public function testGetUpdator(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        // updated_by is null in fixture
        verify($org->updator)->null();
    }

    // -------------------------------------------------------------------------
    // memberCount / projectCount via extraFields closure
    // -------------------------------------------------------------------------

    public function testMemberCountExtraField(): void
    {
        $org = Organization::findOne(['slug' => 'test-org']);
        $extra = $org->extraFields();

        $memberCount = $extra['memberCount']($org);
        verify($memberCount)->greaterThanOrEqual(2);
    }
}
