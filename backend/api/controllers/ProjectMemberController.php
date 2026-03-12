<?php

namespace api\controllers;

use common\models\Project;
use common\models\ProjectMember;
use common\models\search\ProjectMemberSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class ProjectMemberController extends BaseRestController
{
    public $modelClass = ProjectMember::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
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
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)
            ->byId($projectId)->exists();
        if (!$exists) {
            throw new NotFoundHttpException('Project does not exist in the specified organization.');
        }

        $model = ProjectMember::find()->byProjectId($projectId)->byId($id)->one();
        if (!$model) {
            throw new NotFoundHttpException('The requested member does not exist.');
        }

        return $model;
    }
}
