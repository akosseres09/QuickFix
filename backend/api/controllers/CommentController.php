<?php

namespace api\controllers;

use api\components\permissions\Permissions;
use api\components\permissions\PermissionService;
use common\models\Comment;
use common\models\Project;
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
        $userId = Yii::$app->user->id;
        $projectId = Yii::$app->request->get('project_id');

        switch ($action) {
            case 'index':
                if ($projectId && !PermissionService::canDoInProject($projectId, $userId, Permissions::ISSUE_VIEW)) {
                    throw new ForbiddenHttpException('You do not have permission to view comments.');
                }
                break;
            case 'create':
                if ($projectId && !PermissionService::canCreateComment($projectId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to create comments.');
                }
                break;
            case 'view':
                if ($model instanceof Comment && !PermissionService::canViewComment($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view this comment.');
                }
                break;
            case 'update':
                if ($model instanceof Comment && !PermissionService::canUpdateComment($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to update this comment.');
                }
                break;
            case 'delete':
                if ($model instanceof Comment && !PermissionService::canDeleteComment($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to delete this comment.');
                }
                break;
        }
    }

    public function findModel($id)
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required to access comments.');
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to access comments.');
        }

        $issueId = Yii::$app->request->get('issue_id');
        if (!$issueId) {
            throw new BadRequestHttpException('Issue ID is required to access comments.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)->byId($projectId)->exists();
        if (!$exists) {
            throw new NotFoundHttpException('The requested project does not exist!');
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
