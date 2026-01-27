<?php

namespace common\models\search;

use common\models\Project;
use yii\data\ActiveDataProvider;
use Yii;

class ProjectSearch extends Project
{
    public function rules(): array
    {
        return [
            [['id', 'owner_id', 'status'], 'integer'],
            [['name', 'description'], 'safe'],
        ];
    }

    public function search($params)
    {
        $userId = Yii::$app->user->id;

        $query = Project::find()
            ->alias('p')
            ->leftJoin('project_member pm', 'pm.project_id = p.id AND pm.user_id = :userId', [':userId' => $userId])
            ->where([
                'or',
                ['p.visibility' => Project::VISIBILITY_PUBLIC],
                ['p.owner_id' => $userId],
                [
                    'and',
                    ['p.visibility' => Project::VISIBILITY_TEAM],
                    ['is not', 'pm.id', null]
                ]
            ]);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
        ]);

        $this->load($params, '');

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'p.id' => $this->id,
            'p.owner_id' => $this->owner_id,
            'p.status' => $this->status,
        ]);

        $query->andFilterWhere(['like', 'p.name', $this->name])
            ->andFilterWhere(['like', 'p.description', $this->description]);

        return $dataProvider;
    }
}
