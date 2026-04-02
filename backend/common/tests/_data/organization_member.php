<?php

// Depends on: organization.php, user.php

use api\components\permissions\RoleManager;

return [
    [
        'id'              => '01900000-0000-7007-8000-000000000001',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'user_id'         => '01900000-0000-7000-8000-000000000001',
        'role'            => RoleManager::ROLE_OWNER,
        'created_by'      => '01900000-0000-7000-8000-000000000001',
        'created_at'      => 1402312317,
        'updated_by'      => null,
        'updated_at'      => null,
    ],
    [
        'id'              => '01900000-0000-7007-8000-000000000002',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'user_id'         => '01900000-0000-7000-8000-000000000002',
        'role'            => RoleManager::ROLE_MEMBER,
        'created_by'      => '01900000-0000-7000-8000-000000000001',
        'created_at'      => 1402312317,
        'updated_by'      => null,
        'updated_at'      => null,
    ],
    [
        'id'              => '01900000-0000-7007-8000-000000000003',
        'organization_id' => '01900000-0000-7001-8000-000000000002',
        'user_id'         => '01900000-0000-7000-8000-000000000003',
        'role'            => RoleManager::ROLE_OWNER,
        'created_by'      => '01900000-0000-7000-8000-000000000003',
        'created_at'      => 1402312317,
        'updated_by'      => null,
        'updated_at'      => null,
    ],
    [
        'id'              => '01900000-0000-7007-8000-000000000004',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'user_id'         => '01900000-0000-7000-8000-000000000003',
        'role'            => RoleManager::ROLE_ADMIN,
        'created_by'      => '01900000-0000-7000-8000-000000000001',
        'created_at'      => 1402312317,
        'updated_by'      => null,
        'updated_at'      => null,
    ],
];
