<?php

namespace common\models\search;

use common\models\Organization;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class OrganizationSearch extends Organization implements SearchInterface
{
    public function rules(): array
    {
        return [
            [['id', 'created_at', 'updated_at'], 'integer'],
            [['name', 'slug'], 'safe'],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        $userId = Yii::$app->user->id;

        $query = Organization::find()->alias('o')->leftJoin(
            'organization_member om',
            'om.organization_id = o.id AND om.user_id = :userId',
            [':userId' => $userId]
        )->where(['om.user_id' => $userId]);

        $dataProvider = new ActiveDataProvider([
            "query" => $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['name' => SORT_ASC],
                'sortParam' => 'sort',
                'attributes' => [
                    'name',
                    'createdAt' => [
                        'asc' => ['created_at' => SORT_ASC],
                        'desc' => ['created_at' => SORT_DESC],
                    ],
                ],
            ]
        ]);

        $this->load($params, '');

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'id' => $this->id,
            'created_at' => $this->created_at,
        ]);

        $query->andFilterWhere(['ilike', 'slug', $this->slug]);

        return $dataProvider;
    }
}