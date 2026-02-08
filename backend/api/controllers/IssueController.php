<?php

namespace api\controllers;

use common\models\Issue;
use common\models\search\IssueSearch;
use Yii;
use yii\web\ForbiddenHttpException;

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

        return $actions;
    }

    /**
     * {@inheritdoc}
     */
    public function checkAccess($action, $model = null, $params = [])
    {
        if ($model == null) {
            return;
        }

        if (!$model->canAccess(Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to access this issue.');
        }
    }
}
