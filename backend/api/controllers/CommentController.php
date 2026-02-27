<?php

namespace api\controllers;

use api\filters\ProjectKeyTranslatorFilter;
use common\models\Comment;
use common\models\search\CommentSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;


class CommentController extends BaseRestController
{
    public $modelClass = Comment::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        $behaviors["projectTranslator"] = [
            'class' => ProjectKeyTranslatorFilter::class,
            'identifierParamName' => 'project_id',
        ];

        return $behaviors;
    }

    public function actions()
    {
        $actions = parent::actions();

        $actions["index"]['prepareDataProvider'] = function ($action, $filter) {
            $commentSearch = new CommentSearch();
            return $commentSearch->search(Yii::$app->request->queryParams);
        };

        $actions['view']['findModel'] = [$this, 'findModel'];
        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function checkAccess($action, $model = null, $params = [])
    {
        if ($model && !$model->canAccess(Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to access this comment.');
        }
    }

    public function findModel($id)
    {
        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to access comments.');
        }

        $issueId = Yii::$app->request->get('issue_id');
        if (!$issueId) {
            throw new BadRequestHttpException('Issue ID is required to access comments.');
        }

        $comment = Comment::find()->byIssueId($issueId)
            ->byProjectId($projectId)
            ->byId($id)->one();

        if (!$comment) {
            throw new NotFoundHttpException('The requested comment does not exist!');
        }

        return $comment;
    }
}