<?php

namespace common\models\search;

use common\models\Comment;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class CommentSearch extends Comment implements SearchInterface {
    public function search($params): ActiveDataProvider {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int)$params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to search for comments!');
        }

        $issueId = $params['issue_id'] ?? null;
        if (!$issueId) {
            throw new BadRequestHttpException('Issue ID is required to search for comments!');
        }

        $query = Comment::find()->byProject($projectId)->byIssueId($issueId);

        $dataProvider = new ActiveDataProvider([
            'query'=> $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page' 
            ],
            'sort' => [
                'defaultOrder' => ['createdAt' => SORT_DESC],
                'attributes' => [
                    'createdAt' => [
                        'asc' => ['created_at' => SORT_ASC],
                        'desc' => ['created_at' => SORT_DESC],
                    ]
                ]
            ]
        ]);

        return $dataProvider;
    }
}