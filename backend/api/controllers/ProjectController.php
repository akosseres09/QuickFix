<?php

namespace api\controllers;

use api\filters\ProjectKeyTranslatorFilter;
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
        $behaviors["projectTranslator"] = [
            'class' => ProjectKeyTranslatorFilter::class,
            'identifierParamName' => 'id',
            'actions' => ['view', 'update', 'delete'],
        ];

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
        if ($model === null) {
            return;
        }

        // For create action, no model exists yet
        if ($action === 'create') {
            return;
        }

        // For view action, check if user can access the project
        if ($action === 'view') {
            if (!$model->canAccess(Yii::$app->user->id)) {
                throw new ForbiddenHttpException('You do not have permission to access this project.');
            }
        }

        // For update and delete actions, only owner can perform
        if ($action === 'update' || $action === 'delete') {
            if ($model->owner_id !== Yii::$app->user->id) {
                throw new ForbiddenHttpException('Only the project owner can perform this action.');
            }
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
        $project_id = Yii::$app->request->get('id');

        if (!$project_id) {
            throw new NotFoundHttpException('Project ID is required!');
        }

        $project = Project::find()->byId($project_id)->one();

        if (!$project) {
            throw new NotFoundHttpException('Project not found!');
        }

        return $project;
    }

    /**
     * Check if current user is the owner of the project
     */
    protected function checkOwnership(Project $project): void
    {
        if ($project->owner_id !== Yii::$app->user->id) {
            throw new ForbiddenHttpException('Only the project owner can perform this action.');
        }
    }
}
