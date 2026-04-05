<?php

namespace api\controllers;

use api\components\permissions\Permissions;
use api\components\permissions\IssuePermissionService;
use api\components\permissions\ProjectPermissionService;
use common\models\Issue;
use common\models\Label;
use common\models\Project;
use common\models\search\IssueSearch;
use Exception;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

class IssueController extends BaseRestController
{
    public $modelClass = Issue::class;

    public function behaviors(): array
    {
        $actions = ['index', 'view', 'update', 'delete', 'create', 'stats', 'close', 'open'];
        $behaviors = parent::behaviors();
        $behaviors["projectTranslator"]["actions"] = $actions;
        $behaviors['organizationTranslator']["actions"] = $actions;
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
        $organizationId = Yii::$app->request->get('organization_id');

        if (!$projectId || !$organizationId) {
            throw new BadRequestHttpException('Project and Organization IDs are required.');
        }

        $project = Project::find()->byOrganizationId($organizationId)->byId($projectId)->one();
        if (!$project) {
            throw new NotFoundHttpException('Project not found for the given project ID and organization ID.');
        }

        if (!ProjectPermissionService::canViewProject($project, Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to view issues in this project.');
        }

        $today = mktime(0, 0, 0);

        // Fetch dynamic status counts with names and colors
        $statusData = Yii::$app->db->createCommand(
            'SELECT 
                l.name, 
                l.color, 
                COUNT(i.id) as count
            FROM {{%label}} l
            LEFT JOIN {{%issue}} i ON i.status_label = l.id 
                AND i.project_id = :project_id
                AND i.is_archived = FALSE
                AND i.is_draft = FALSE
            WHERE l.project_id = :project_id OR l.project_id IS NULL
            GROUP BY l.id, l.name, l.color
            HAVING COUNT(i.id) > 0 OR l.name IN (:open, :closed)',
            [
                ':project_id' => $projectId,
                ':open' => Label::STATUS_OPEN,
                ':closed' => Label::STATUS_CLOSED
            ]
        )->queryAll();

        // Fetch priorities, types, and activity
        $generalStats = Yii::$app->db->createCommand(
            'SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE priority = :low)      AS priority_low,
                COUNT(*) FILTER (WHERE priority = :medium)   AS priority_medium,
                COUNT(*) FILTER (WHERE priority = :high)     AS priority_high,
                COUNT(*) FILTER (WHERE priority = :critical) AS priority_critical,
                COUNT(*) FILTER (WHERE type = :bug)          AS type_bug,
                COUNT(*) FILTER (WHERE type = :feature)      AS type_feature,
                COUNT(*) FILTER (WHERE type = :task)         AS type_task,
                COUNT(*) FILTER (WHERE type = :incident)     AS type_incident,
                COUNT(*) FILTER (WHERE created_at >= :today) AS created_today,
                COUNT(*) FILTER (WHERE closed_at  >= :today) AS closed_today
            FROM {{%issue}}
            WHERE project_id = :project_id
                AND is_archived = FALSE
                AND is_draft    = FALSE',
            [
                ':project_id' => $projectId,
                ':today' => $today,
                ':low' => Issue::PRIORITY_LOW,
                ':medium' => Issue::PRIORITY_MEDIUM,
                ':high' => Issue::PRIORITY_HIGH,
                ':critical' => Issue::PRIORITY_CRITICAL,
                ':bug' => Issue::TYPE_BUG,
                ':feature' => Issue::TYPE_FEATURE,
                ':task' => Issue::TYPE_TASK,
                ':incident' => Issue::TYPE_INCIDENT,
            ]
        )->queryOne();

        // Generate last 7 days range
        $statsRange = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $statsRange[$date] = ['created' => 0, 'closed' => 0];
        }

        // Fetch created counts
        $createdData = Yii::$app->db->createCommand(
            'SELECT TO_CHAR(TO_TIMESTAMP(created_at), \'YYYY-MM-DD\') as date, COUNT(*) as count
            FROM {{%issue}}
            WHERE project_id = :pid AND created_at >= :since
            GROUP BY date',
            [':pid' => $projectId, ':since' => strtotime('-7 days')]
        )->queryAll();

        // Fetch closed counts
        $closedData = Yii::$app->db->createCommand(
            'SELECT TO_CHAR(TO_TIMESTAMP(closed_at), \'YYYY-MM-DD\') as date, COUNT(*) as count
            FROM {{%issue}}
            WHERE project_id = :pid AND closed_at >= :since
            GROUP BY date',
            [':pid' => $projectId, ':since' => strtotime('-7 days')]
        )->queryAll();

        // Map results back to our range
        foreach ($createdData as $row) {
            $statsRange[$row['date']]['created'] = (int)$row['count'];
        }
        foreach ($closedData as $row) {
            $statsRange[$row['date']]['closed'] = (int)$row['count'];
        }

        return [
            'statuses' => array_map(function ($item) {
                return [
                    'label' => $item['name'],
                    'color' => $item['color'],
                    'count' => (int) $item['count']
                ];
            }, $statusData),
            'totals' => [
                'total' => (int) $generalStats['total'],
            ],
            'priorities' => [
                'low' => (int) $generalStats['priority_low'],
                'medium' => (int) $generalStats['priority_medium'],
                'high' => (int) $generalStats['priority_high'],
                'critical' => (int) $generalStats['priority_critical'],
            ],
            'types' => [
                'bug' => (int) $generalStats['type_bug'],
                'feature' => (int) $generalStats['type_feature'],
                'task' => (int) $generalStats['type_task'],
                'incident' => (int) $generalStats['type_incident'],
            ],
            'activity' => [
                'createdToday' => (int) $generalStats['created_today'],
                'closedToday' => (int) $generalStats['closed_today'],
            ],
            'trend' => [
                'labels' => array_keys($statsRange),
                'created' => array_column($statsRange, 'created'),
                'closed' => array_column($statsRange, 'closed'),
            ]
        ];
    }

    public function actionClose($id): Issue
    {
        /** @var Issue $issue */
        $issue = $this->findModel($id);

        if (!IssuePermissionService::canUpdateIssue($issue, Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to close this issue.');
        }

        try {
            $issue->closeIssue();
            $issue->save();
        } catch (Exception $e) {
            throw new ServerErrorHttpException('Failed to close the issue');
        }

        return $issue;
    }

    public function actionOpen($id): Issue
    {
        $issue = $this->findModel($id);

        if (!IssuePermissionService::canUpdateIssue($issue, Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to open this issue.');
        }

        try {
            $issue->openIssue();
            $issue->save();
        } catch (Exception $e) {
            throw new ServerErrorHttpException('Failed to open the issue');
        }

        return $issue;
    }

    /**
     * {@inheritdoc}
     */
    public function checkAccess($action, $model = null, $params = [])
    {
        $userId = Yii::$app->user->id;
        $projectId = Yii::$app->request->get('project_id');

        switch ($action) {
            case 'index':
                if ($projectId && !ProjectPermissionService::canDoInProject($projectId, $userId, Permissions::ISSUE_VIEW)) {
                    throw new ForbiddenHttpException('You do not have permission to view issues in this project.');
                }
                break;
            case 'create':
                if ($projectId && !IssuePermissionService::canCreateIssue($projectId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to create issues in this project.');
                }
                break;
            case 'view':
                if ($model instanceof Issue && !IssuePermissionService::canViewIssue($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view this issue.');
                }
                break;
            case 'update':
                if ($model instanceof Issue && !IssuePermissionService::canUpdateIssue($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to update this issue.');
                }
                break;
            case 'delete':
                if ($model instanceof Issue && !IssuePermissionService::canDeleteIssue($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to delete this issue.');
                }
                break;
        }
    }

    public function findModel($id)
    {
        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to access issues.');
        }

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required to access issues.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)->byId($projectId)->exists();
        if (!$exists) {
            throw new BadRequestHttpException('Project not found for the given project_id and organization_id.');
        }

        $issue = Issue::find()->byProjectId($projectId)->byId($id)->one();
        if (!$issue) {
            throw new NotFoundHttpException('The requested issue does not exist.');
        }

        return $issue;
    }
}
