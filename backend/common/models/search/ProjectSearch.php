<?php

namespace common\models\search;

use common\models\Project;
use yii\data\ActiveDataProvider;
use Yii;

class ProjectSearch extends Project implements SearchInterface
{
    public function rules(): array
    {
        return [
            [['id', 'owner_id', 'status'], 'string'],
            [['priority'], 'integer'],
            [
                'is_archived',
                'filter',
                'filter' => function ($value) {
                    if ($value === 'true')
                        return true;
                    if ($value === 'false')
                        return false;
                    return $value;
                }
            ],
            [['name'], 'safe'],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $userId = Yii::$app->user->id;
        $organizationId = Yii::$app->request->get('organization_id');

        // Define a subquery to count ALL members for a project
        // This allows us to sort by 'total members' without breaking the main query
        $memberCountSql = '(SELECT COUNT(*) FROM project_member pm2 WHERE pm2.project_id = p.id)';

        $query = Project::find()
            ->alias('p')
            ->leftJoin('project_member pm', 'pm.project_id = p.id AND pm.user_id = :userId', [':userId' => $userId])
            ->where([
                'or',
                ['p.visibility' => Project::VISIBILITY_PUBLIC],
                ['p.owner_id' => $userId],
                [
                    'and',
                    ['in', 'p.visibility', [Project::VISIBILITY_TEAM, Project::VISIBILITY_PRIVATE]],
                    ['is not', 'pm.id', null]
                ]
            ])->andWhere(['p.organization_id' => $organizationId]);

        // Extract pagination params from request
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;

        // Limit pageSize to prevent abuse
        $pageSize = min($pageSize, 100);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'page' => $page - 1, // Yii uses 0-based page index
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['name' => SORT_ASC, 'priority' => SORT_ASC],
                'enableMultiSort' => true,
                'sortParam' => 'sort',
                'attributes' => [
                    'name' => [
                        'asc' => ['p.name' => SORT_ASC],
                        'desc' => ['p.name' => SORT_DESC],
                    ],
                    'createdAt' => [
                        'asc' => ['p.created_at' => SORT_ASC],
                        'desc' => ['p.created_at' => SORT_DESC],
                    ],
                    'status' => [
                        'asc' => ['p.status' => SORT_ASC],
                        'desc' => ['p.status' => SORT_DESC],
                    ],
                    'priority',
                    'users' => [
                        'asc' => [$memberCountSql => SORT_ASC],
                        'desc' => [$memberCountSql => SORT_DESC],
                    ],
                ],
            ],
        ]);

        $this->load($params, '');

        if (!$this->validate()) {
            return $dataProvider;
        }

        if ($this->is_archived === null) {
            $this->is_archived = false;
        }

        $query->andFilterWhere([
            'p.id' => $this->id,
            'p.owner_id' => $this->owner_id,
            'p.status' => $this->status,
            'p.priority' => $this->priority,
            'p.is_archived' => $this->is_archived
        ]);

        $query->andFilterWhere(['ilike', 'p.name', $this->name]);

        return $dataProvider;
    }
}
