<?php

namespace api\models\query;

use \yii\db\ActiveQuery;

class UserRefreshTokenQuery extends ActiveQuery
{
    public function notExpired(): UserRefreshTokenQuery
    {
        return $this->andWhere(['>', 'expires_at', time()]);
    }

    public function byToken(string $token): UserRefreshTokenQuery
    {
        return $this->andWhere(['token' => $token]);
    }

    public function byUserId(int $userId): UserRefreshTokenQuery
    {
        return $this->andWhere(['user_id' => $userId]);
    }

    public function notRevoked(): UserRefreshTokenQuery
    {
        return $this->andWhere(['revoked_at' => null]);
    }

    public function byIp(string $ip): UserRefreshTokenQuery
    {
        return $this->andWhere(['ip' => $ip]);
    }
}
