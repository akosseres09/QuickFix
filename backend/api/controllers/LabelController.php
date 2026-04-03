<?php

namespace api\controllers;

use api\components\permissions\Permissions;
use api\components\permissions\PermissionService;
use common\models\Label;
use common\models\Project;
use common\models\search\LabelSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ConflictHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class LabelController extends BaseRestController
{
    public $modelClass = Label::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $actions = ['index', 'view', 'create', 'update', 'delete', 'reorder'];
        $behaviors['projectTranslator']['actions'] = $actions;
        $behaviors['organizationTranslator']['actions'] = $actions;
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

    public function actionReorder($id)
    {
        $label = $this->findModel($id);
        $this->checkAccess('reorder', $label);

        $newIndex = Yii::$app->request->post('new_index');
        if ($newIndex === null || !is_numeric($newIndex)) {
            throw new BadRequestHttpException('New index is required.');
        }

        if ($newIndex <= 0 || $newIndex > 30) {
            throw new BadRequestHttpException('Index must be between 1 and 30.');
        }

        if ($label->reorder($newIndex)) {
            return $label;
        }

        throw new ConflictHttpException('Failed to reorder label.');
    }

    public function checkAccess($action, $model = null, $params = [])
    {
        $userId = Yii::$app->user->id;
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        switch ($action) {
            case 'index':
            case 'create':
            case 'update':
            case 'delete':
            case 'reorder':
                if (!PermissionService::canDoInProject($projectId, $userId, Permissions::PROJECT_UPDATE)) {
                    throw new ForbiddenHttpException('You do not have permission to manage labels in this project.');
                }
                break;
        }
    }

    public function findModel($id): Label
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
