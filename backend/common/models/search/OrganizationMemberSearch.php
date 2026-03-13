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
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

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
