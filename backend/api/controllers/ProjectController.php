<?php

namespace api\controllers;

use api\components\ResponseMaker;
use common\models\Project;
use common\models\ProjectMember;
use common\models\search\ProjectSearch;
use Yii;
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
     * Add a member to the project
     */
    public function actionAddMember(string $id): array
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
        $member->project_id = $project->id;
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
    public function actionRemoveMember(string $id, int $memberId): array
    {
        $project = $this->findModel($id);
        $this->checkOwnership($project);

        $member = ProjectMember::findOne(['id' => $memberId, 'project_id' => $project->id]);

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
     * Used by view, delete and update actions to find the model based on the key value provided in the URL.
     * @param string $id
     * @throws NotFoundHttpException if the model cannot be found
     * @return Project the loaded model
     */
    public function findModel($id): Project
    {
        $project = Project::find()->byKey($id)->one();

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
