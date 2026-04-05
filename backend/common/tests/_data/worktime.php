<?php

// Depends on: issue.php, user.php

return [
    [
        'id'             => '01900000-0000-7006-8000-000000000001',
        'issue_id'       => '01900000-0000-7004-8000-000000000001',
        'created_by'     => '01900000-0000-7000-8000-000000000001',
        'updated_by'     => null,
        'minutes_spent'  => 90,
        'description'    => 'Investigated root cause and implemented fix.',
        'logged_at'      => '2024-01-15',
        'created_at'     => time() - 60 * 60 * 24 * 30,
        'updated_at'     => null,
    ],
    [
        'id'             => '01900000-0000-7006-8000-000000000002',
        'issue_id'       => '01900000-0000-7004-8000-000000000001',
        'created_by'     => '01900000-0000-7000-8000-000000000002',
        'updated_by'     => '01900000-0000-7000-8000-000000000002',
        'minutes_spent'  => 30,
        'description'    => 'Code review and testing.',
        'logged_at'      => '2024-01-16',
        'created_at'     => time() - 60 * 60 * 24 * 2,
        'updated_at'     => time() - 60 * 60 * 24 * 1,
    ],
    [
        'id'             => '01900000-0000-7006-8000-000000000003',
        'issue_id'       => '01900000-0000-7004-8000-000000000002',
        'created_by'     => '01900000-0000-7000-8000-000000000001',
        'updated_by'     => null,
        'minutes_spent'  => 1,
        'description'    => '',
        'logged_at'      => '2024-02-01',
        'created_at'     => time() - 60 * 60 * 24 * 3,
        'updated_at'     => null,
    ],
];
