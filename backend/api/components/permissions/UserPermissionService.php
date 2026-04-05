<?php

namespace api\components\permissions;

use common\models\UserRole;
use Yii;

class UserPermissionService
{
    public static function canUpdateUser(string $targetUserId, string $requestingUserId): bool
    {
        if ($targetUserId === $requestingUserId) {
            return true;
        }
        $user = Yii::$app->user->identity;
        return $user && UserRole::tryFrom((int)$user->is_admin) === UserRole::ADMIN;
    }

    public static function canDeleteUser(string $targetUserId, string $requestingUserId): bool
    {
        if ($targetUserId === $requestingUserId) {
            return true;
        }
        $user = Yii::$app->user->identity;
        return $user && UserRole::tryFrom((int)$user->is_admin) === UserRole::ADMIN;
    }
}
