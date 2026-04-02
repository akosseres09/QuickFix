<?php

// Depends on: organization.php (organization_id), user.php (owner_id)

use common\models\Project;

return [
    [
        'id'              => '01900000-0000-7002-8000-000000000001',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'name'            => 'Test Project',
        'key'             => 'TEST',
        'description'     => 'A project used in automated tests.',
        'status'          => Project::STATUS_ACTIVE,
        'owner_id'        => '01900000-0000-7000-8000-000000000001',
        'updated_by'      => null,
        'visibility'      => Project::VISIBILITY_PUBLIC,
        'priority'        => Project::PRIORITY_MEDIUM,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312317,
        'archived_at'     => null,
        'is_archived'     => false,
    ],
    [
        'id'              => '01900000-0000-7002-8000-000000000002',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'name'            => 'Private Project',
        'key'             => 'PRIV',
        'description'     => 'A private project for access control tests.',
        'status'          => Project::STATUS_ON_HOLD,
        'owner_id'        => '01900000-0000-7000-8000-000000000001',
        'updated_by'      => null,
        'visibility'      => Project::VISIBILITY_PRIVATE,
        'priority'        => Project::PRIORITY_HIGH,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312317,
        'archived_at'     => null,
        'is_archived'     => false,
    ],
    [
        'id'              => '01900000-0000-7002-8000-000000000003',
        'organization_id' => '01900000-0000-7001-8000-000000000001',
        'name'            => 'Team Project',
        'key'             => 'TEAM',
        'description'     => 'A team-visibility project.',
        'status'          => Project::STATUS_COMPLETED,
        'owner_id'        => '01900000-0000-7000-8000-000000000001',
        'updated_by'      => null,
        'visibility'      => Project::VISIBILITY_TEAM,
        'priority'        => Project::PRIORITY_LOW,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312317,
        'archived_at'     => 1402312400,
        'is_archived'     => true,
    ],
];
