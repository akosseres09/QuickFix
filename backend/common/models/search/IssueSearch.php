<?php

namespace common\models\search;

use common\models\Issue;

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

        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new \InvalidArgumentException('Project ID is required for issue search.');
        }

        $query = Issue::find()->byProject($projectId);

        $dataProvider = new \yii\data\ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['created_at' => SORT_DESC],
                'attributes' => [
                    'created_at',
                    'updated_at',
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

        return $dataProvider;
    }
}
