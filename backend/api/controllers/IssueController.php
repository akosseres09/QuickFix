<?php

namespace api\controllers;

use api\filters\ProjectKeyTranslatorFilter;
use common\models\Issue;
use common\models\Project;
use common\models\search\IssueSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class IssueController extends BaseRestController
{
    public $modelClass = Issue::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors["projectTranslator"] = [
            'class' => ProjectKeyTranslatorFilter::class,
            'identifierParamName' => 'project_id',
            'actions' => ['index', 'view', 'update', 'delete', 'create', 'stats']
        ];

        return $behaviors;
    }

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


    public function actionStats(): array
    {
        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $project = Project::find()->byId($projectId)->one();
        if (!$project) {
            throw new NotFoundHttpException('Requested project not found!');
        }

        if (!$project->canAccess(Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to access this project.');
        }

        $today = mktime(0, 0, 0); // beginning of today (Unix timestamp)

        $row = Yii::$app->db->createCommand('
        SELECT
            COUNT(*)                                        AS total,
            COUNT(*) FILTER (WHERE status = :open)          AS status_open,
            COUNT(*) FILTER (WHERE status = :in_progress)   AS status_in_progress,
            COUNT(*) FILTER (WHERE status = :review)        AS status_review,
            COUNT(*) FILTER (WHERE status = :resolved)      AS status_resolved,
            COUNT(*) FILTER (WHERE status = :closed)        AS status_closed,
            COUNT(*) FILTER (WHERE priority = :low)         AS priority_low,
            COUNT(*) FILTER (WHERE priority = :medium)      AS priority_medium,
            COUNT(*) FILTER (WHERE priority = :high)        AS priority_high,
            COUNT(*) FILTER (WHERE priority = :critical)    AS priority_critical,
            COUNT(*) FILTER (WHERE type = :bug)             AS type_bug,
            COUNT(*) FILTER (WHERE type = :feature)         AS type_feature,
            COUNT(*) FILTER (WHERE type = :task)            AS type_task,
            COUNT(*) FILTER (WHERE type = :incident)        AS type_incident,
            COUNT(*) FILTER (WHERE created_at >= :today)    AS created_today,
            COUNT(*) FILTER (WHERE closed_at  >= :today)    AS closed_today
        FROM {{%issue}}
        WHERE project_id = :project_id
          AND is_archived = FALSE
          AND is_draft    = FALSE
    ', [
            ':project_id' => $projectId,
            ':today' => $today,
            ':open' => Issue::STATUS_OPEN,
            ':in_progress' => Issue::STATUS_IN_PROGRESS,
            ':review' => Issue::STATUS_REVIEW,
            ':resolved' => Issue::STATUS_RESOLVED,
            ':closed' => Issue::STATUS_CLOSED,
            ':low' => Issue::PRIORITY_LOW,
            ':medium' => Issue::PRIORITY_MEDIUM,
            ':high' => Issue::PRIORITY_HIGH,
            ':critical' => Issue::PRIORITY_CRITICAL,
            ':bug' => Issue::TYPE_BUG,
            ':feature' => Issue::TYPE_FEATURE,
            ':task' => Issue::TYPE_TASK,
            ':incident' => Issue::TYPE_INCIDENT,
        ])->queryOne();

        return [
            'totals' => [
                'total' => (int) $row['total'],
                'open' => (int) $row['status_open'],
                'inProgress' => (int) $row['status_in_progress'],
                'inReview' => (int) $row['status_review'],
                'resolved' => (int) $row['status_resolved'],
                'closed' => (int) $row['status_closed'],
            ],
            'priorities' => [
                'low' => (int) $row['priority_low'],
                'medium' => (int) $row['priority_medium'],
                'high' => (int) $row['priority_high'],
                'critical' => (int) $row['priority_critical'],
            ],
            'types' => [
                'bug' => (int) $row['type_bug'],
                'feature' => (int) $row['type_feature'],
                'task' => (int) $row['type_task'],
                'incident' => (int) $row['type_incident'],
            ],
            'activity' => [
                'createdToday' => (int) $row['created_today'],
                'closedToday' => (int) $row['closed_today'],
            ],
        ];
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

        $issue = Issue::find()->byProjectId($projectId)->byId($id)->one();
        if (!$issue) {
            throw new NotFoundHttpException('The requested issue does not exist.');
        }

        return $issue;
    }
}
