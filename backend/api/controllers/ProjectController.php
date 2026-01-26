<?php

namespace api\controllers;

use api\components\ResponseMaker;
use common\models\Project;
use common\models\ProjectMember;
use Yii;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class ProjectController extends BaseRestController
{
    public $modelClass = Project::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors['verbs'] = array_merge($behaviors['verbs'] ?? [], [
            'class' => VerbFilter::class,
            'actions' => [
                'add-member' => ['POST'],
                'remove-member' => ['DELETE'],
            ],
        ]);

        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        // Configure the index action with custom data provider
        $actions['index']['prepareDataProvider'] = [$this, 'prepareDataProvider'];

        return $actions;
    }

    /**
     * Prepare data provider for index action with visibility filtering
     */
    public function prepareDataProvider()
    {
        $userId = Yii::$app->user->id;

        $query = Project::find()
            ->alias('p')
            ->leftJoin('project_member pm', 'pm.project_id = p.id AND pm.user_id = :userId', [':userId' => $userId])
            ->where([
                'or',
                ['p.visibility' => Project::VISIBILITY_PUBLIC],
                ['p.owner_id' => $userId],
                [
                    'and',
                    ['p.visibility' => Project::VISIBILITY_TEAM],
                    ['is not', 'pm.id', null]
                ]
            ]);

        return new ActiveDataProvider([
            'query' => $query,
        ]);
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
     * Add a member to the project
     */
    public function actionAddMember(int $id): array
    {
        $project = $this->findModel($id);
        $this->checkOwnership($project);

        $userId = Yii::$app->request->post('user_id');
        $role = Yii::$app->request->post('role', ProjectMember::ROLE_MEMBER);

        if (!$userId) {
            throw new BadRequestHttpException('User ID is required.');
        }

        // Check if project is team visibility
        if ($project->visibility !== Project::VISIBILITY_TEAM) {
            throw new BadRequestHttpException('Can only add members to team projects.');
        }

        $member = new ProjectMember();
        $member->project_id = $id;
        $member->user_id = $userId;
        $member->role = $role;

        if ($member->save()) {
            return ResponseMaker::asSuccess([
                'member' => $member,
                'user' => $member->user,
                'message' => 'Member added successfully.',
            ], 201);
        }

        return ResponseMaker::asError('Failed to add member.', 422, [
            'errors' => $member->getErrors()
        ]);
    }

    /**
     * Remove a member from the project
     */
    public function actionRemoveMember(int $id, int $memberId): array
    {
        $project = $this->findModel($id);
        $this->checkOwnership($project);

        $member = ProjectMember::findOne(['id' => $memberId, 'project_id' => $id]);

        if (!$member) {
            throw new NotFoundHttpException('Member not found.');
        }

        if ($member->delete()) {
            return ResponseMaker::asSuccess([
                'message' => 'Member removed successfully.',
            ]);
        }

        return ResponseMaker::asError('Failed to remove member.', 500);
    }

    /**
     * Find project model by ID
     */
    protected function findModel(int $id): Project
    {
        $model = Project::findOne($id);

        if ($model === null) {
            throw new NotFoundHttpException('Project not found.');
        }

        return $model;
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
