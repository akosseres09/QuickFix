<?php

namespace api\components\permissions;

class RoleManager
{
    const ROLE_GUEST = 'guest';
    const ROLE_MEMBER = 'member';
    const ROLE_ADMIN = 'admin';
    const ROLE_OWNER = 'owner';

    private static array $weights = [
        self::ROLE_GUEST => 10,
        self::ROLE_MEMBER => 20,
        self::ROLE_ADMIN => 30,
        self::ROLE_OWNER => 40,
    ];

    public static function getWeight(string $role): int
    {
        return self::$weights[$role] ?? 0;
    }
}
