<?php

namespace common\models\search;

use yii\data\ActiveDataProvider;

interface SearchInterface {
    public function search($params): ActiveDataProvider;
}