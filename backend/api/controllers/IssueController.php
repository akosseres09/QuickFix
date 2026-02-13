<?php

namespace api\controllers;

use common\models\Issue;
use common\models\Project;
use common\models\search\IssueSearch;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class IssueController extends BaseRestController
{
    public $modelClass = Issue::class;

    public function actions(): array
    {
        $actions = parent::actions();

        // Configure the index action with custom data provider
        $actions['index']['prepareDataProvider'] = function ($action, $filter) {
            $issueSearch = new IssueSearch();
            return $issueSearch->search(Yii::$app->request->queryParams);
        };

        $actions['view']['findModel'] = [$this, 'findModel'];
        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    /**
     * {@inheritdoc}
     */
    public function checkAccess($action, $model = null, $params = [])
    {
        if ($model && !$model->canAccess(Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to access this issue.');
        }
    }

    public function findModel($id)
    {
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new ForbiddenHttpException('Project ID is required to access issues.');
        }

        $project = null;

        // projectId can be either a 36 long UUID or a project key, so we need to check both
        if (strlen($projectId) !== 36) {
            $project = Project::find()->byKey($projectId)->one();
            if (!$project) {
                throw new NotFoundHttpException('The requested project does not exist.');
            }
        }

        $issue = Issue::find()->byProjectId($project ? $project->id : $projectId)->byId($id)->one();

        if (!$issue) {
            throw new NotFoundHttpException('The requested issue does not exist.');
        }

        return $issue;
    }
}
