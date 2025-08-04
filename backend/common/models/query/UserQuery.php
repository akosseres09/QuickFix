<?php

namespace common\models\query;

use common\models\User;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * This is the ActiveQuery class for [[User]].
 *
 * @see User
 */
class UserQuery extends ActiveQuery
{

    public function all($db = null): array
    {
        return parent::all($db);
    }

    public function one($db = null): ActiveRecord|User|null
    {
        return parent::one($db);
    }

    public function active(): UserQuery
    {
        return $this->andWhere(['status' => User::STATUS_ACTIVE]);
    }

    public function inactive(): UserQuery
    {
        return $this->andWhere(['status' => User::STATUS_INACTIVE]);
    }

    public function deleted(): UserQuery
    {
        return $this->andWhere(['status' => User::STATUS_DELETED]);
    }

    public function admin(): UserQuery
    {
        return $this->andWhere(['is_admin' => User::ADMIN]);
    }

    public function user(): UserQuery
    {
        return $this->andWhere(['is_admin' => User::USER]);
    }

    public function byEmail(string $email): UserQuery
    {
        return $this->andWhere(['email' => $email]);
    }

    public function byEmailVerificationToken(string $token): UserQuery
    {
        return $this->andWhere(['verification_token' => $token]);
    }
}
