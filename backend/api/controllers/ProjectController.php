<?php

namespace api\controllers;

use api\components\permissions\PermissionService;
use common\models\Project;
use common\models\search\ProjectSearch;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class ProjectController extends BaseRestController
{
    public $modelClass = Project::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors["projectTranslator"]['identifierParamName'] = 'id';
        $behaviors["projectTranslator"]['actions'] = ['view', 'update', 'delete'];
        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        // Configure the index action with custom data provider
        $actions['index']['prepareDataProvider'] = function ($action, $filter) {
            $searchModel = new ProjectSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };

        // Configure actions to use custom findModel (find by key instead of ID)
        $actions['view']['findModel'] = [$this, 'findModel'];
        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    /**
     * Check access for individual model operations
     * Called automatically by Yii2's default actions (view, update, delete)
     */
    public function checkAccess($action, $model = null, $params = [])
    {
        $userId = Yii::$app->user->id;
        $organizationId = Yii::$app->request->get('organization_id');

        switch ($action) {
            case 'index':
                if ($organizationId && !PermissionService::canViewOrganization($organizationId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view projects in this organization.');
                }
                break;
            case 'create':
                if (!PermissionService::canCreateProject($organizationId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to create a project in this organization.');
                }
                break;
            case 'view':
                if ($model && !PermissionService::canViewProject($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to access this project.');
                }
                break;
            case 'update':
                if ($model && !PermissionService::canUpdateProject($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to update this project.');
                }
                break;
            case 'delete':
                if ($model && !PermissionService::canDeleteProject($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to delete this project.');
                }
                break;
        }
    }

    /**
     * Used by view, delete and update actions to find the model based on the key value provided in the URL.
     * @param string $id
     * @throws NotFoundHttpException if the model cannot be found
     * @return Project the loaded model
     */
    public function findModel($id): Project
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new NotFoundHttpException('Organization ID is required!');
        }

        $project_id = Yii::$app->request->get('id');
        if (!$project_id) {
            throw new NotFoundHttpException('Project ID is required!');
        }

        $project = Project::find()->byOrganizationId($organizationId)
            ->byId($project_id)->one();
        if (!$project) {
            throw new NotFoundHttpException('Project not found!');
        }

        return $project;
    }
}
