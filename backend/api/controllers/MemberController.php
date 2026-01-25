<?php

namespace api\controllers;

use common\models\ProjectMember;
use Yii;

class MemberController extends BaseRestController
{
    public $modelClass = ProjectMember::class;

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['view'], $actions['update']);
        $actions['index']['prepareDataProvider'] = [$this, 'prepareDataProvider'];
        return $actions;
    }


    public function prepareDataProvider()
    {
        $projectId = Yii::$app->request->get('projectId');

        if (!$projectId) {
            throw new \yii\web\BadRequestHttpException('Project ID is required.');
        }

        $query = ProjectMember::find()->where(['project_id' => $projectId]);
        return new \yii\data\ActiveDataProvider([
            'query' => $query,
        ]);
    }
}
