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

    public function byUserId(string $userId): OrganizationMemberQuery
    {
        return $this->andWhere(["{{organization_member}}.user_id" => $userId]);
    }

    public function byUsername(string $username): OrganizationMemberQuery
    {
        return $this->joinWith('user')->andWhere(["{{user}}.username" => $username]);
    }

    public function byId(string $id): OrganizationMemberQuery
    {
        return $this->andWhere(["{{organization_member}}.id" => $id]);
    }

    public function byOrganization(string $organizationId)
    {
        return $this->andWhere(["{{organization_member}}.organization_id" => $organizationId]);
    }

    public function byCursor(string $cursor): OrganizationMemberQuery
    {
        return $this->andWhere(['>', '{{organization_member}}.id', $cursor]);
    }
}
