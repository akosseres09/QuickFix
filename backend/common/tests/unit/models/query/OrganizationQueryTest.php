<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\OrganizationFixture;
use common\fixtures\UserFixture;
use common\models\Organization;

class OrganizationQueryTest extends Unit
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
                'class'    => OrganizationFixture::class,
                'dataFile' => codecept_data_dir() . 'organization.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingRecord(): void
    {
        $result = Organization::find()
            ->byId('01900000-0000-7001-8000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->slug)->equals('test-org');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Organization::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // bySlug
    // -------------------------------------------------------------------------

    public function testBySlugReturnsMatchingRecord(): void
    {
        $result = Organization::find()
            ->bySlug('test-org')
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-7001-8000-000000000001');
        verify($result->name)->equals('Test Organization');
    }

    public function testBySlugReturnsSecondOrg(): void
    {
        $result = Organization::find()
            ->bySlug('second-org')
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-7001-8000-000000000002');
    }

    public function testBySlugReturnsNullForUnknownSlug(): void
    {
        $result = Organization::find()
            ->bySlug('nonexistent-slug')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByIdAndBySlug(): void
    {
        $result = Organization::find()
            ->byId('01900000-0000-7001-8000-000000000001')
            ->bySlug('test-org')
            ->one();

        verify($result)->notNull();
    }

    public function testChainingByIdAndWrongSlugReturnsNull(): void
    {
        $result = Organization::find()
            ->byId('01900000-0000-7001-8000-000000000001')
            ->bySlug('second-org')
            ->one();

        verify($result)->null();
    }
}
