<?php

namespace api\controllers;

use api\components\permissions\WorktimePermissionService;
use common\models\Project;
use common\models\search\WorktimeSearch;
use common\models\Worktime;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class WorktimeController extends BaseRestController
{
    public $modelClass = Worktime::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        $behaviors["projectTranslator"]["actions"] = ["index", "stats"];
        $behaviors["organizationTranslator"]["actions"] = ["index", "update", "delete", "create", "stats"];

        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        $actions["index"]['prepareDataProvider'] = function () {
            $searchModel = new WorktimeSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };

        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function checkAccess($action, $model = null, $params = [])
    {
        $userId = Yii::$app->user->id;
        $orgId = Yii::$app->request->get('organization_id');

        switch ($action) {
            case 'index':
                if ($orgId && !WorktimePermissionService::canViewWorktime($orgId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view worktime entries.');
                }
                break;
            case 'create':
                if ($orgId && !WorktimePermissionService::canCreateWorktime($orgId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to create worktime entries.');
                }
                break;
            case 'update':
                if ($model instanceof Worktime && !WorktimePermissionService::canUpdateWorktime($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to update this worktime entry.');
                }
                break;
            case 'delete':
                if ($model instanceof Worktime && !WorktimePermissionService::canDeleteWorktime($model, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to delete this worktime entry.');
                }
                break;
        }
    }

    public function actionStats(): array
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        if (!WorktimePermissionService::canViewWorktime($organizationId, Yii::$app->user->id)) {
            throw new ForbiddenHttpException('You do not have permission to view worktime stats.');
        }

        $projectId = Yii::$app->request->get('project_id');
        $startDate = Yii::$app->request->get('start_date', date('Y-m-d', strtotime('-1 week')));
        $endDate = Yii::$app->request->get('end_date', date('Y-m-d'));

        if ($startDate && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
            throw new BadRequestHttpException('Invalid start_date format. Use Y-m-d.');
        }
        if ($endDate && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            throw new BadRequestHttpException('Invalid end_date format. Use Y-m-d.');
        }

        if ($projectId) {
            $exists = Project::find()->byOrganizationId($organizationId)->byId($projectId)->exists();
            if (!$exists) {
                throw new NotFoundHttpException('Project not found for the given organization.');
            }
            $query = Worktime::find()->byProjectId($projectId);
        } else {
            $query = Worktime::find()->byOrganizationId($organizationId);
        }

        $query->andFilterWhere(['>=', '{{%worktime}}.logged_at', $startDate])
            ->andFilterWhere(['<=', '{{%worktime}}.logged_at', $endDate]);

        $totals = (clone $query)
            ->select(['SUM({{%worktime}}.minutes_spent) AS total_minutes', 'COUNT(*) AS total_entries'])
            ->asArray()
            ->one();

        $totalMinutes = (int) ($totals['total_minutes'] ?? 0);
        $totalEntries = (int) ($totals['total_entries'] ?? 0);

        $distinctDaysResult = (clone $query)
            ->select(['COUNT(DISTINCT {{%worktime}}.logged_at) AS distinct_days'])
            ->asArray()
            ->one();

        $distinctDays = max(1, (int) ($distinctDaysResult['distinct_days'] ?? 0));

        $mostProductiveDayRow = (clone $query)
            ->select(['{{%worktime}}.logged_at', 'SUM({{%worktime}}.minutes_spent) AS day_minutes'])
            ->groupBy('{{%worktime}}.logged_at')
            ->orderBy(['day_minutes' => SORT_DESC])
            ->limit(1)
            ->asArray()
            ->one();

        $hoursPerDayRows = (clone $query)
            ->select(['{{%worktime}}.logged_at AS date', 'SUM({{%worktime}}.minutes_spent) AS total_minutes'])
            ->groupBy('{{%worktime}}.logged_at')
            ->orderBy(['{{%worktime}}.logged_at' => SORT_ASC])
            ->asArray()
            ->all();

        $hoursPerUserRows = (clone $query)
            ->select(['{{%worktime}}.created_by AS user_id', 'SUM({{%worktime}}.minutes_spent) AS total_minutes'])
            ->groupBy('{{%worktime}}.created_by')
            ->orderBy(['total_minutes' => SORT_DESC])
            ->asArray()
            ->all();

        return [
            'totalHours' => round($totalMinutes / 60, 2),
            'totalEntries' => $totalEntries,
            'avgHoursPerDay' => $totalEntries > 0 ? round(($totalMinutes / 60) / $distinctDays, 2) : 0,
            'mostProductiveDay' => $mostProductiveDayRow ? [
                'date' => $mostProductiveDayRow['logged_at'],
                'hours' => round($mostProductiveDayRow['day_minutes'] / 60, 2),
            ] : null,
            'hoursPerDay' => array_map(fn($row) => [
                'date' => $row['date'],
                'hours' => round($row['total_minutes'] / 60, 2),
            ], $hoursPerDayRows),
            'hoursPerUser' => array_map(fn($row) => [
                'userId' => $row['user_id'],
                'hours' => round($row['total_minutes'] / 60, 2),
            ], $hoursPerUserRows),
        ];
    }

    public function findModel($id): Worktime
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required to find a worktime entry.');
        }

        $model = Worktime::find()->byId($id)->byOrganizationId($organizationId)->one();
        if (!$model) {
            throw new NotFoundHttpException('Worktime entry not found for the given id and organization id.');
        }
        return $model;
    }
}
