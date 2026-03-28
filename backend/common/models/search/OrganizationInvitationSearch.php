<?php

namespace common\models\search;

use api\components\permissions\RoleManager;
use common\components\traits\EagerExpandTrait;
use common\models\OrganizationInvitation;
use common\models\OrganizationMember;
use Yii;
use yii\data\ActiveDataProvider;

class OrganizationInvitationSearch extends OrganizationInvitation implements SearchInterface
{
    use EagerExpandTrait;
    public function rules(): array
    {
        return [
            ['role', 'in', 'range' => RoleManager::ROLE_LIST],
            ['status', 'in', 'range' => self::STATUSES],
            [['organization_id'], 'string', 'max' => 36],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 100);

        $query = OrganizationInvitation::find()->byEmail(Yii::$app->user->identity->email);
        $this->applyExpand($query);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'page' => $page - 1,
                'pageSize' => $pageSize,
                'pageSizeParam' => 'pageSize',
                'pageParam' => 'page',
            ],
            'sort' => [
                'defaultOrder' => ['expires_at' => SORT_DESC],
                'attributes' => [
                    'expires_at',
                    'status'
                ]
            ],
        ]);

        $this->load($params, '');
        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere([
            'organization_id' => $this->organization_id,
            'status' => $this->status,
            'role' => $this->role,
        ]);

        return $dataProvider;
    }
}
