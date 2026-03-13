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

    public function one($db = null)
    {
        return parent::one($db);
    }

    public function byId($id)
    {
        return $this->andWhere(['{{%organization_invitation}}.id' => $id]);
    }

    public function byOrganization($organizationId)
    {
        return $this->andWhere(['{{%organization_invitation}}.organization_id' => $organizationId]);
    }

    public function byEmail($email)
    {
        return $this->andWhere(['{{%organization_invitation}}.email' => $email]);
    }

    public function pending()
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_PENDING]);
    }

    public function accepted()
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_ACCEPTED]);
    }

    public function revoked()
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_REVOKED]);
    }

    public function rejected()
    {
        return $this->andWhere(['{{%organization_invitation}}.status' => OrganizationInvitation::STATUS_REJECTED]);
    }
}
