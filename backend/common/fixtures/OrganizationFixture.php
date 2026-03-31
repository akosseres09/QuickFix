<?php

namespace common\fixtures;

use common\models\Organization;
use yii\test\ActiveFixture;

class OrganizationFixture extends ActiveFixture
{
    public $modelClass = Organization::class;
    public $dataFile = __DIR__ . '/../tests/_data/organization.php';
    public $depends = [UserFixture::class];
}
