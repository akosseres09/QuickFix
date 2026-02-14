<?php

namespace common\models\resource;

use common\models\User;

class UserResource extends User
{
    public function fields(): array
    {
        return [
            'id',
            'username',
            'email',
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'phoneNumber' => 'phone_number',
            'dateOfBirth' => 'date_of_birth',
            'profilePictureUrl' => 'profile_picture_url',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
        ];
    }
}
