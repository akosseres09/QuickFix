<?php

// Depends on: user.php (owner_id → user.id)

return [
    [
        'id'          => '01900000-0000-7001-8000-000000000001',
        'name'        => 'Test Organization',
        'slug'        => 'test-org',
        'description' => 'An organization used in automated tests.',
        'owner_id'    => '01900000-0000-7000-8000-000000000001',
        'logo_url'    => null,
        'created_at'  => 1402312317,
        'updated_at'  => 1402312317,
        'updated_by'  => null,
        'deleted_at'  => null,
    ],
    [
        'id'          => '01900000-0000-7001-8000-000000000002',
        'name'        => 'Second Organization',
        'slug'        => 'second-org',
        'description' => 'A second org for isolation tests.',
        'owner_id'    => '01900000-0000-7000-8000-000000000003',
        'logo_url'    => null,
        'created_at'  => 1402312317,
        'updated_at'  => 1402312317,
        'updated_by'  => null,
        'deleted_at'  => null,
    ],
];
