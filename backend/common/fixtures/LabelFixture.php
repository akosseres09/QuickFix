<?php

namespace common\fixtures;

use common\models\Label;
use yii\test\ActiveFixture;

class LabelFixture extends ActiveFixture
{
    public $modelClass = Label::class;
    public $dataFile = __DIR__ . '/../tests/_data/label.php';
    public $depends = [ProjectFixture::class];
}
