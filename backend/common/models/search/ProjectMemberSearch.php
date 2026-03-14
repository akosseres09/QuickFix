<?php

namespace common\models\search;

use common\models\Project;
use common\models\ProjectMember;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class ProjectMemberSearch extends ProjectMember implements SearchInterface
{
    public function rules(): array
    {
        return [
            [['id', 'project_id', 'user_id'], 'string', 'max' => 36],
            [['role'], 'integer'],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 30);

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)
            ->byId($projectId)->exists();

        if (!$exists) {
            throw new BadRequestHttpException('Project does not exist in the specified organization.');
        }

        $cursor = $params['cursor'] ?? null;

        $userId = Yii::$app->user->id;
        $query = ProjectMember::find()->byProjectId($projectId);
        if ($cursor) {
            $query->byCursor($cursor);
        }

        $query->orderBy(['{{%project_member}}.id' => SORT_ASC]);
        $query->limit($pageSize);

        $dataprovider = new ActiveDataProvider([
            'query' => $query,
            'sort' => false,
            'pagination' => false,
        ]);

        $models = $query->all();

        if (!empty($models)) {
            $lastModel = end($models);

            $headers = Yii::$app->response->headers;
            $headers->set('X-Cursor', $lastModel->id);

            $hasMore = count($models) === $pageSize ? 'true' : 'false';
            $headers->set('X-Has-More', $hasMore);
        }

        return $dataprovider;
    }
}
