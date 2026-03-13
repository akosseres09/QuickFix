<?php

namespace common\models\query;

use common\models\OrganizationInvitation;
use yii\db\ActiveQuery;

class OrganizationInvitationQuery extends ActiveQuery
{
    public function all($db = null)
    {
        return parent::all($db);
    }

    public function one($db = null): ?OrganizationInvitation
    {
        return parent::one($db);
    }

    public function byId($id): self
    {
        return $this->andWhere(['{{%organization_invitation}}.id' => $id]);
    }

    public function byOrganization($organizationId): self
    {
        return $this->andWhere(['{{%organization_invitation}}.organization_id' => $organizationId]);
    }

    public function byToken($token): self
    {
        return $this->andWhere(['{{%organization_invitation}}.token' => $token]);
    }

    public function byEmail($email): self
    {
        return $this->andWhere(['{{%organization_invitation}}.email' => $email]);
    }

    public function pending(): self
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_PENDING]);
    }

    public function accepted(): self
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_ACCEPTED]);
    }

    public function revoked(): self
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_REVOKED]);
    }

    public function rejected(): self
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_REJECTED]);
    }
}
