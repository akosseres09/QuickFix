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
        return [
            'projectTranslator' => [
                'class' => ProjectKeyTranslatorFilter::class,
            ],
        ];
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
        dd($projectId);

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
