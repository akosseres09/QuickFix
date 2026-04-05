<?php

namespace common\fixtures;

use common\models\OrganizationMember;
use yii\test\ActiveFixture;

class OrganizationMemberFixture extends ActiveFixture
{
    public $modelClass = OrganizationMember::class;
    public $dataFile = __DIR__ . '/../tests/_data/organization_member.php';
    public $depends = [OrganizationFixture::class, UserFixture::class];
}
