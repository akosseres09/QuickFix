<?php

namespace common\models\search;

use common\models\Project;
use yii\data\ActiveDataProvider;
use Yii;

class ProjectSearch extends Project
{
    public function rules(): array
    {
        return [
            [['id', 'owner_id'], 'string'],
            [['status'], 'integer'],
            [['name', 'description'], 'safe'],
        ];
    }

    public function search($params)
    {
        $userId = Yii::$app->user->id;

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
                    ['p.visibility' => Project::VISIBILITY_TEAM],
                    ['is not', 'pm.id', null]
                ]
            ]);

        // 2. REMOVED: $query->groupBy('p.id'); 
        // Since the Left Join only matches the distinct current user, rows are already unique.

        // Extract pagination params from request
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int)$params['pageSize'] : 20;

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
                'defaultOrder' => ['name' => SORT_ASC],
                'enableMultiSort' => true,
                'sortParam' => 'sort',
                'attributes' => [
                    'name' => [
                        'asc' => ['p.name' => SORT_ASC],
                        'desc' => ['p.name' => SORT_DESC],
                    ],
                    'created_at' => [
                        'asc' => ['p.created_at' => SORT_ASC],
                        'desc' => ['p.created_at' => SORT_DESC],
                    ],
                    'createdAt' => [
                        'asc' => ['p.created_at' => SORT_ASC],
                        'desc' => ['p.created_at' => SORT_DESC],
                    ],
                    'status' => [
                        'asc' => ['p.status' => SORT_ASC],
                        'desc' => ['p.status' => SORT_DESC],
                    ],
                    // 3. Update the Sort to use the subquery
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

        $query->andFilterWhere([
            'p.id' => $this->id,
            'p.owner_id' => $this->owner_id,
            'p.status' => $this->status,
        ]);

        $query->andFilterWhere(['like', 'p.name', $this->name])
            ->andFilterWhere(['like', 'p.description', $this->description]);

        return $dataProvider;
    }
}
