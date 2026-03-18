<?php

namespace common\models\query;

use common\models\User;
use common\models\UserRole;
use common\models\UserStatus;
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
        return $this->andWhere(['{{%user}}.status' => UserStatus::ACTIVE->value]);
    }

    public function inactive(): UserQuery
    {
        return $this->andWhere(['{{%user}}.status' => UserStatus::INACTIVE->value]);
    }

    public function deleted(): UserQuery
    {
        return $this->andWhere(['{{%user}}.status' => UserStatus::DELETED->value]);
    }

    public function admin(): UserQuery
    {
        return $this->andWhere(['{{%user}}.is_admin' => UserRole::ADMIN->value]);
    }

    public function user(): UserQuery
    {
        return $this->andWhere(['{{%user}}.is_admin' => UserRole::USER->value]);
    }

    public function byId(string $id): UserQuery
    {
        return $this->andWhere(['{{%user}}.id' => $id]);
    }

    public function byEmail(string $email): UserQuery
    {
        return $this->andWhere(['{{%user}}.email' => $email]);
    }

    public function byEmailVerificationToken(string $token): UserQuery
    {
        return $this->andWhere(['{{%user}}.verification_token' => $token]);
    }

    public function byUsername(string $username): UserQuery
    {
        return $this->andWhere(['{{%user}}.username' => $username]);
    }
}
