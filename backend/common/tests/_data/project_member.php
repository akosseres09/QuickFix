<?php

// Depends on: project.php, user.php

use api\components\permissions\RoleManager;

return [
    [
        'id'         => '01900000-0000-0008-0000-000000000001',
        'project_id' => '01900000-0000-0002-0000-000000000001',
        'user_id'    => '01900000-0000-0000-0000-000000000001',
        'role'       => RoleManager::ROLE_OWNER,
        'created_at' => 1402312317,
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'updated_at' => null,
    ],
    [
        'id'         => '01900000-0000-0008-0000-000000000002',
        'project_id' => '01900000-0000-0002-0000-000000000001',
        'user_id'    => '01900000-0000-0000-0000-000000000002',
        'role'       => RoleManager::ROLE_MEMBER,
        'created_at' => 1402312317,
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'updated_at' => null,
    ],
    [
        'id'         => '01900000-0000-0008-0000-000000000003',
        'project_id' => '01900000-0000-0002-0000-000000000002',
        'user_id'    => '01900000-0000-0000-0000-000000000001',
        'role'       => RoleManager::ROLE_OWNER,
        'created_at' => 1402312317,
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'updated_at' => null,
    ],
    [
        'id'         => '01900000-0000-0008-0000-000000000004',
        'project_id' => '01900000-0000-0002-0000-000000000003',
        'user_id'    => '01900000-0000-0000-0000-000000000001',
        'role'       => RoleManager::ROLE_OWNER,
        'created_at' => 1402312317,
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'updated_at' => null,
    ],
    [
        'id'         => '01900000-0000-0008-0000-000000000005',
        'project_id' => '01900000-0000-0002-0000-000000000003',
        'user_id'    => '01900000-0000-0000-0000-000000000002',
        'role'       => RoleManager::ROLE_MEMBER,
        'created_at' => 1402312317,
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'updated_at' => null,
    ],
];
