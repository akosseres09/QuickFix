<?php


namespace common\models\query;

use common\models\Organization;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

class OrganizationMemberQuery extends ActiveQuery
{
    public function all($db = null): array
    {
        return parent::all($db);
    }

    public function one($db = null): ActiveRecord|Organization|null
    {
        return parent::one($db);
    }

    public function byId(string $id): OrganizationMemberQuery
    {
        return $this->andWhere(["id" => $id]);
    }

    public function byOrganization(string $organizationId)
    {
        return $this->andWhere(["organization_id" => $organizationId]);
    }
}