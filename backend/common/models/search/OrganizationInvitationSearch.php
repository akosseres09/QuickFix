<?php

namespace common\models\search;

use common\models\OrganizationInvitation;
use yii\data\ActiveDataProvider;

class OrganizationInvitationSearch extends OrganizationInvitation implements SearchInterface
{
    public function search($params): ActiveDataProvider
    {
        $query = OrganizationInvitation::find();

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => false,
        ]);

        $this->load($params, '');

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere(['organization_id' => $this->organization_id]);
        $query->andFilterWhere(['email' => $this->email]);
        $query->andFilterWhere(['token' => $this->token]);

        return $dataProvider;
    }
}
