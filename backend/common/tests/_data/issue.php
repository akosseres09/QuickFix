<?php

// Depends on: project.php, label.php, user.php

return [
    [
        'id'           => '01900000-0000-0004-0000-000000000001',
        'project_id'   => '01900000-0000-0002-0000-000000000001',
        'issue_key'    => 'TEST-1',
        'title'        => 'Fix login button alignment',
        'description'  => 'The login button is misaligned on mobile.',
        'type'         => 3,   // Issue::TYPE_BUG
        'status_label' => '01900000-0000-0003-0000-000000000001', // Open
        'priority'     => 2,   // Issue::PRIORITY_HIGH
        'created_by'   => '01900000-0000-0000-0000-000000000001',
        'updated_by'   => '01900000-0000-0000-0000-000000000001',
        'assigned_to'  => '01900000-0000-0000-0000-000000000002',
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
        'closed_at'    => null,
        'due_date'     => null,
        'is_archived'  => false,
        'is_draft'     => false,
    ],
];
