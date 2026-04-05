<?php

namespace common\tests\unit\models\resource;

use Codeception\Test\Unit;
use common\models\resource\UserResource;
use common\models\User;
use common\tests\UnitTester;

class UserResourceTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures()
    {
        return [
            'user' => [
                'class'    => \common\fixtures\UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
        ];
    }

    public function testFields(): void
    {
        $user = User::findOne(['username' => 'bayer.hudson']);
        $resource = new UserResource($user);

        $fields = $resource->fields();

        verify($fields)->arrayContains('id');
        verify($fields)->arrayContains('username');
        verify($fields)->arrayContains('email');

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

        verify($fields)->arrayHasKey('createdAt');
        verify($fields)->arrayContains('created_at');

        verify($fields)->arrayHasKey('updatedAt');
        verify($fields)->arrayContains('updated_at');
        verify($fields)->arrayContains('fullName');
    }
}
