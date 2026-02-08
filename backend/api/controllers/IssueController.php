<?php

namespace api\controllers;

use common\models\Issue;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;

class IssueController extends BaseRestController
{
    public $modelClass = Issue::class;

    public function actions(): array
    {
        $actions = parent::actions();

        // Configure the index action with custom data provider
        $actions['index']['prepareDataProvider'] = function ($action, $filter) {
            $params = Yii::$app->request->queryParams;

            if (!isset($params['projectId'])) {
                throw new BadRequestHttpException('Project ID is required to list issues.');
            }

            $query = Issue::find()->byProject($params['projectId']);
            return $query->all();
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

        if (!$model->canAccess($this->userId)) {
            throw new  ForbiddenHttpException('You do not have permission to access this issue.');
        }
    }
}
