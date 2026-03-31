<?php

namespace common\fixtures;

use common\models\Comment;
use yii\test\ActiveFixture;

class CommentFixture extends ActiveFixture
{
    public $modelClass = Comment::class;
    public $dataFile = __DIR__ . '/../tests/_data/comment.php';
    public $depends = [IssueFixture::class];
}
