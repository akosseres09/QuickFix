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
        unset($actions['view']);
        $actions['index']['prepareDataProvider'] = [$this, 'prepareDataProvider'];
        return $actions;
    }


    public function prepareDataProvider()
    {
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new \yii\web\BadRequestHttpException('Project ID is required.');
        }

        $query = ProjectMember::find();

        // by UUID
        if (strlen($projectId) === 36) {
            $query->byProject($projectId);
        } else {
            $query->byProjectKey($projectId);
        }

        return new \yii\data\ActiveDataProvider([
            'query' => $query,
        ]);
    }

    public function findModel($id)
    {
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new \yii\web\BadRequestHttpException('Project ID is required.');
        }

        $query = ProjectMember::find()->andWhere(['id' => $id]);

        // by UUID
        if (strlen($projectId) === 36) {
            $query->byProject($projectId);
        } else {
            $query->byProjectKey($projectId);
        }

        $model = $query->one();

        if (!$model) {
            throw new \yii\web\NotFoundHttpException('The requested member does not exist.');
        }

        return $model;
    }
}
