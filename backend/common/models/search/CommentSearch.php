<?php

namespace common\models\search;

use common\models\Comment;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class CommentSearch extends Comment implements SearchInterface {
    public function search($params): ActiveDataProvider {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int)$params['pageSize'] : 10;
        $pageSize = min($pageSize, 100);

        $cursor = $params['cursor'] ?? null;
        $projectId = $params['project_id'] ?? null;
        $issueId = $params['issue_id'] ?? null;

        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to search for comments!');
        }

        if (!$issueId) {
            throw new BadRequestHttpException('Issue ID is required to search for comments!');
        }

        $query = Comment::find()->byProject($projectId)->byIssueId($issueId);

        if ($cursor) {
            $query->andWhere(['>', 'comment.id', $cursor]);
        }

        $query->orderBy(['comment.id' => SORT_ASC]);
        $query->limit($pageSize);

        $dataProvider = new ActiveDataProvider([
            'query'=> $query,
            'pagination' => false,
            'sort' => false
        ]);

        $models = $query->all();

        $dataProvider->setModels($models);

        if (!empty($models)) {
            $lastModel = end($models);

            $headers = Yii::$app->response->headers;
            $headers->set('X-Next-Cursor', $lastModel->id);

            $hasMore = count($models) === $pageSize ? 'true' : 'false';
            $headers->set('X-Has-More', $hasMore);
        }

        return $dataProvider;
    }
}