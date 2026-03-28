<?php

namespace common\models\search;

use common\models\Project;
use yii\data\ActiveDataProvider;
use yii\db\Expression;
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

        $memberCountSql = '(SELECT COUNT(*) FROM project_member pm2 WHERE pm2.project_id = p.id)';

        $query = Project::find()
            ->alias('p')
            ->select(['p.*'])
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

        // Dynamically eager-load relations and add count subqueries based on expand param
        $this->applyExpand($query);

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

    /**
     * Parses the `expand` query param and applies eager loading / count subqueries.
     *
     * - Relations (owner, organization, members, etc.) → `->with()`
     * - Counts (issueCount, memberCount) → added as SELECT subqueries
     */
    private function applyExpand($query): void
    {
        $expand = Yii::$app->request->get('expand', '');
        if (empty($expand)) {
            return;
        }

        $requested = array_map('trim', explode(',', $expand));

        // Relations that can be eager-loaded with ->with()
        $eagerLoadable = ['owner', 'organization', 'labels', 'issues', 'members', 'projectMembers'];

        // Count fields that use subquery selects
        $countSubqueries = [
            'issueCount' => '(SELECT COUNT(*) FROM issue i WHERE i.project_id = p.id)',
            'memberCount' => '(SELECT COUNT(*) FROM project_member pm2 WHERE pm2.project_id = p.id)',
        ];

        $withRelations = [];
        foreach ($requested as $field) {
            if (in_array($field, $eagerLoadable, true)) {
                $withRelations[] = $field;
            }

            if (isset($countSubqueries[$field])) {
                $query->addSelect([$field => new Expression($countSubqueries[$field])]);
            }
        }

        if (!empty($withRelations)) {
            $query->with($withRelations);
        }
    }
}
