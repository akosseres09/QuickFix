<?php

namespace common\models\search;

use common\models\Label;
use common\models\Project;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;


class LabelSearch extends Label implements SearchInterface
{
    public function rules(): array
    {
        return [
            ['project_id', 'required'],
            ['name', 'string', 'max' => 24],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        $organizationId = $params['organization_id'] ?? null;
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required for label search.');
        }

        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required for label search.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)
            ->byId($projectId)->exists();
        if (!$exists) {
            throw new NotFoundHttpException('Requested project not found!');
        }

        $query = Label::find()->byProjectId($projectId);
        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['name' => SORT_ASC],
                'attributes' => [
                    'name'
                ]
            ]
        ]);

        $this->load($params, '');
        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'ilike',
            'name',
            $this->name
        ]);

        return $dataProvider;
    }
}