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

        $query = Label::find()->allForProject($projectId);
        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => false,
            'sort' => [
                'defaultOrder' => ['index' => SORT_ASC],
                'attributes' => [
                    'index'
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
