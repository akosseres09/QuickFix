<?php

namespace common\models\search;

use common\components\traits\EagerExpandTrait;
use common\models\OrganizationMember;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class OrganizationMemberSearch extends OrganizationMember implements SearchInterface
{
    use EagerExpandTrait;

    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $cursor = $params['cursor'] ?? null;
        $search = $params['search'] ?? null;

        $query = OrganizationMember::find()->byOrganization($organizationId);
        $this->applyExpand($query);

        if ($search) {
            $query->joinWith('user')
                ->andWhere([
                    'or',
                    ['like', '{{%user}}.first_name', $search],
                    ['like', '{{%user}}.last_name', $search],
                    ['like', '{{%user}}.email', $search],
                    ['like', '{{%user}}.username', $search],
                ]);
        }

        if ($cursor) {
            $query->byCursor($cursor);
        }

        $query->limit($pageSize + 1); // Fetch one extra to determine if there's a next page

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'sort' => false,
            'pagination' => false
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

            $headers->set('X-Cursor', $lastModel->id);
            $headers->set('X-Has-More', $hasMore);
        } else {
            $headers->set('X-Has-More', 'false');
        }

        return $dataProvider;
    }
}
