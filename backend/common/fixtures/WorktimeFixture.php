<?php

namespace common\fixtures;

use common\models\Worktime;
use yii\test\ActiveFixture;

class WorktimeFixture extends ActiveFixture
{
    public $modelClass = Worktime::class;
    public $dataFile = __DIR__ . '/../tests/_data/worktime.php';
    public $depends = [IssueFixture::class];
}
