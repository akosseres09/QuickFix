<?php

namespace api\controllers;

use common\models\Issue;
use common\models\search\IssueSearch;
use Yii;
use yii\web\BadRequestHttpException;
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
            throw new BadRequestHttpException('Project ID is required to access issues.');
        }

        $issue = Issue::find()->byProject($projectId)->byId($id)->one();
        if (!$issue) {
            throw new NotFoundHttpException('The requested issue does not exist.');
        }

        return $issue;
    }
}
