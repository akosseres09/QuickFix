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
            'first_name',
            'last_name',
            'phone_number',
            'date_of_birth',
            'profile_picture_url',
        ];
    }
}
