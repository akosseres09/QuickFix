<?php

namespace common\models\search;

use common\models\OrganizationMember;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class OrganizationMemberSearch extends OrganizationMember implements SearchInterface
{

    public function search($params): ActiveDataProvider
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $query = OrganizationMember::find()->byOrganization($organizationId);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
        ]);

        return $dataProvider;
    }
}