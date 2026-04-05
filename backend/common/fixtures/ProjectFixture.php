<?php

namespace common\fixtures;

use common\models\Project;
use yii\test\ActiveFixture;

class ProjectFixture extends ActiveFixture
{
    public $modelClass = Project::class;
    public $dataFile = __DIR__ . '/../tests/_data/project.php';
    public $depends = [OrganizationFixture::class];
}
