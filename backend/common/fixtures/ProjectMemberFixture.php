<?php

namespace common\fixtures;

use common\models\ProjectMember;
use yii\test\ActiveFixture;

class ProjectMemberFixture extends ActiveFixture
{
    public $modelClass = ProjectMember::class;
    public $dataFile = __DIR__ . '/../tests/_data/project_member.php';
    public $depends = [ProjectFixture::class, UserFixture::class];
}
