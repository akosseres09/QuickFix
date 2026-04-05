<?php

namespace common\fixtures;

use yii\test\ActiveFixture;

class UserRefreshTokenFixture extends ActiveFixture
{
    public $modelClass = 'api\models\UserRefreshToken';
    public $dataFile = __DIR__ . '/../tests/_data/user_refresh_token.php';
    public $depends = [UserFixture::class];
}
