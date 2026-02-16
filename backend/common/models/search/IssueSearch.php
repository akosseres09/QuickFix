<?php

namespace common\models\search;

use common\models\Issue;
use common\models\Project;

class IssueSearch extends Issue
{
    public function rules(): array
    {
        return [
            ['project_id', 'required'],
            [['id', 'project_id'], 'string'],
            [['status', 'type', 'priority'], 'integer'],
            ['is_archived', 'boolean'],
            [['title', 'description'], 'safe'],
        ];
    }

    public function search($params)
    {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int)$params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        // Can be the project ID or project key
        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new \InvalidArgumentException('Project ID is required for issue search.');
        }

        $project = null;
        // if $projectId is not project.id then try to find project by key
        if (strlen($projectId) !== 36) {
            $project = Project::find()->byKey($projectId)->one();
            if (!$project) {
                throw new \InvalidArgumentException('Project not found with the given ID or key.');
            }
        }

        $query = Issue::find()->byProjectId($project ? $project->id : $projectId);

        $dataProvider = new \yii\data\ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['createdAt' => SORT_DESC],
                'attributes' => [
                    'createdAt' => [
                        'asc' => ['created_at' => SORT_ASC],
                        'desc' => ['created_at' => SORT_DESC],
                    ],
                    'updatedAt' => [
                        'asc' => ['updated_at' => SORT_ASC],
                        'desc' => ['updated_at' => SORT_DESC],
                    ],
                    'status',
                    'type',
                    'priority',
                ]
            ],
        ]);

        $this->load($params, '');

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'status' => $this->status,
            'type' => $this->type,
            'priority' => $this->priority,
            'is_archived' => $this->is_archived
        ]);

        $query->andFilterWhere(['like','title', $this->title]);

        return $dataProvider;
    }
}
