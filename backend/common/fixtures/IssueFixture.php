<?php

namespace common\fixtures;

use common\models\Issue;
use yii\test\ActiveFixture;

class IssueFixture extends ActiveFixture
{
    public $modelClass = Issue::class;
    public $dataFile = __DIR__ . '/../tests/_data/issue.php';
    public $depends = [LabelFixture::class, UserFixture::class];
}
