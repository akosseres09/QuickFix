<?php

namespace common\models\search;

use common\models\Label;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;


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

        $projectId = $params['project_id'] ?? null;
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required for label search.');
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
            'like',
            'name',
            $this->name
        ]);

        return $dataProvider;
    }
}