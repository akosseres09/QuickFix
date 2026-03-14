<?php

namespace common\models\search;

use common\models\Comment;
use common\models\Project;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class CommentSearch extends Comment implements SearchInterface
{
    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 10;
        $pageSize = min($pageSize, 100);

        $cursor = $params['cursor'] ?? null;
        $projectId = $params['project_id'] ?? null;
        $issueId = $params['issue_id'] ?? null;
        $organizationId = $params['organization_id'] ?? null;

        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required to search for comments!');
        }

        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required to search for comments!');
        }

        if (!$issueId) {
            throw new BadRequestHttpException('Issue ID is required to search for comments!');
        }

        $exists = Project::find()->byOrganizationId($organizationId)->byId($projectId)->exists();
        if (!$exists) {
            throw new BadRequestHttpException('Project not found in the specified organization!');
        }

        $query = Comment::find()->byProjectId($projectId)->byIssueId($issueId);

        if ($cursor) {
            $query->andWhere(['>', 'comment.id', $cursor]);
        }

        $query->orderBy(['comment.id' => SORT_ASC]);
        $query->limit($pageSize + 1);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => false,
            'sort' => false
        ]);

        $models = $query->all();
        $hasMore = 'false';

        if (count($models) > $pageSize) {
            $hasMore = 'true';
            array_pop($models);
        }

        $headers = Yii::$app->response->headers;
        if (!empty($models)) {
            $dataProvider->setModels($models);
            $lastModel = end($models);

            $headers->set('X-Next-Cursor', $lastModel->id);
            $headers->set('X-Has-More', $hasMore);
        } else {
            $headers->set('X-Has-More', 'false');
        }

        return $dataProvider;
    }
}
