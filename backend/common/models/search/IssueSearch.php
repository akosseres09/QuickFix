<?php

namespace common\models\search;

use common\models\Issue;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class IssueSearch extends Issue implements SearchInterface
{
    public function rules(): array
    {
        return [
            ['project_id', 'required'],
            [['id', 'project_id'], 'string'],
            [['status', 'type', 'priority'], 'integer'],
            ['is_archived', 'filter', 'filter' => function ($value) {
                if ($value === 'true') return true;
                if ($value === 'false') return false;
                return $value;
            }],
            [['title', 'description'], 'safe'],
        ];
    }

    public function fields(): array {
        return parent::fields();
    }

    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int)$params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        // Can be the project ID or project key
        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required for issue search.');
        }

        $query = Issue::find()->byProject( $projectId);

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

        if ($this->is_archived === null) {
            $this->is_archived = false;
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
