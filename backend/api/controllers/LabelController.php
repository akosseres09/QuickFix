<?php

namespace api\controllers;

use api\filters\ProjectKeyTranslatorFilter;
use common\models\Label;
use common\models\Project;
use common\models\search\LabelSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class LabelController extends BaseRestController
{
    public $modelClass = Label::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        unset($actions['view']);

        $actions['index']['prepareDataProvider'] = function () {
            $searchModel = new LabelSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };

        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function checkAccess($action, $model = null, $params = [])
    {
        if ($model && !$model->canAccess(Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to access this label.');
        }
    }

    public function findModel($id)
    {
        $organization_id = Yii::$app->request->get('organization_id');
        if (!$organization_id) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $project_id = Yii::$app->request->get('project_id');
        if (!$project_id) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $exists = Project::find()->byOrganizationId($organization_id)
            ->byId($project_id)->exists();
        if (!$exists) {
            throw new NotFoundHttpException('Requested project not found!');
        }

        $model = Label::find()->byProjectId($project_id)->byId($id)->one();
        if (!$model) {
            throw new NotFoundHttpException('The requested label does not exist.');
        }

        return $model;
    }
}