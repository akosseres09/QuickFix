<?php

namespace api\controllers;

use api\filters\ProjectKeyTranslatorFilter;
use common\models\ProjectMember;
use common\models\search\ProjectMemberSearch;
use Yii;

class MemberController extends BaseRestController
{
    public $modelClass = ProjectMember::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors["projectTranslator"] = [
            'class' => ProjectKeyTranslatorFilter::class,
            'identifierParamName' => 'project_id',
        ];

        return $behaviors;
    }

    public function actions()
    {
        $actions = parent::actions();
        $actions['index']['prepareDataProvider'] = function () {
            $searchModel = new ProjectMemberSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };
        return $actions;
    }

    public function findModel($id)
    {
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new \yii\web\BadRequestHttpException('Project ID is required.');
        }

        $model = ProjectMember::find()->andWhere(['id' => $id])->byProjectId($projectId)->one();

        if (!$model) {
            throw new \yii\web\NotFoundHttpException('The requested member does not exist.');
        }

        return $model;
    }
}
