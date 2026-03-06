<?php


namespace common\models\query;

use common\models\Organization;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

class OrganizationQuery extends ActiveQuery
{
    public function all($db = null): array
    {
        return parent::all($db);
    }

    public function one($db = null): ActiveRecord|Organization|null
    {
        return parent::one($db);
    }

    /**
     * Filter by Organization ID
     * @param string $id
     * @return OrganizationQuery
     */
    public function byId(string $id): OrganizationQuery
    {
        return $this->andWhere(["id" => $id]);
    }

    /**
     * Filter by Organization slug
     * @param string $slug
     * @return OrganizationQuery
     */
    public function bySlug(string $slug): OrganizationQuery
    {
        return $this->andWhere(["slug" => $slug]);
    }
}