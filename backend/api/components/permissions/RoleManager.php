<?php

namespace api\components\permissions;

class RoleManager
{
    const ROLE_GUEST = 'guest';
    const ROLE_MEMBER = 'member';
    const ROLE_ADMIN = 'admin';
    const ROLE_OWNER = 'owner';

    public static function getWeight(?string $role): int
    {
        return match ($role) {
            self::ROLE_GUEST => 10,
            self::ROLE_MEMBER => 20,
            self::ROLE_ADMIN => 30,
            self::ROLE_OWNER => 40,
            default => 0,
        };
    }
}
