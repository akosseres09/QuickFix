<?php

// Depends on: issue.php, user.php

return [
    [
        'id'         => '01900000-0000-0005-0000-000000000001',
        'issue_id'   => '01900000-0000-0004-0000-000000000001',
        'created_by' => '01900000-0000-0000-0000-000000000002',
        'updated_by' => '01900000-0000-0000-0000-000000000002',
        'content'    => 'This is a test comment on the issue.',
        'created_at' => 1402312317,
        'updated_at' => 1402312317,
    ],
    [
        'id'         => '01900000-0000-0005-0000-000000000002',
        'issue_id'   => '01900000-0000-0004-0000-000000000001',
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => null,
        'content'    => 'Another comment with <strong>HTML</strong> content.',
        'created_at' => 1402312400,
        'updated_at' => null,
    ],
    [
        'id'         => '01900000-0000-0005-0000-000000000003',
        'issue_id'   => '01900000-0000-0004-0000-000000000002',
        'created_by' => '01900000-0000-0000-0000-000000000001',
        'updated_by' => '01900000-0000-0000-0000-000000000001',
        'content'    => 'Comment on the closed issue.',
        'created_at' => 1402312500,
        'updated_at' => 1402312600,
    ],
];
