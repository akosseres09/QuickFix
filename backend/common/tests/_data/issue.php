<?php

// Depends on: project.php, label.php, user.php

use common\models\Issue;

return [
    [
        'id'           => '01900000-0000-7004-8000-000000000001',
        'project_id'   => '01900000-0000-7002-8000-000000000001',
        'issue_key'    => 'TEST-1',
        'title'        => 'Fix login button alignment',
        'description'  => 'The login button is misaligned on mobile.',
        'type'         => Issue::TYPE_BUG,
        'status_label' => '01900000-0000-7003-8000-000000000001', // Open
        'priority'     => Issue::PRIORITY_HIGH,
        'created_by'   => '01900000-0000-7000-8000-000000000001',
        'updated_by'   => '01900000-0000-7000-8000-000000000001',
        'assigned_to'  => '01900000-0000-7000-8000-000000000002',
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
        'closed_at'    => null,
        'due_date'     => null,
        'is_archived'  => false,
        'is_draft'     => false,
    ],
    [
        'id'           => '01900000-0000-7004-8000-000000000002',
        'project_id'   => '01900000-0000-7002-8000-000000000001',
        'issue_key'    => 'TEST-2',
        'title'        => 'Implement dark mode',
        'description'  => 'Add dark mode support to the application.',
        'type'         => Issue::TYPE_FEATURE,
        'status_label' => '01900000-0000-7003-8000-000000000002', // Closed
        'priority'     => Issue::PRIORITY_MEDIUM,
        'created_by'   => '01900000-0000-7000-8000-000000000001',
        'updated_by'   => '01900000-0000-7000-8000-000000000001',
        'assigned_to'  => null,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
        'closed_at'    => 1402312400,
        'due_date'     => 1402398717,
        'is_archived'  => false,
        'is_draft'     => true,
    ],
    [
        'id'           => '01900000-0000-7004-8000-000000000003',
        'project_id'   => '01900000-0000-7002-8000-000000000001',
        'issue_key'    => 'TEST-3',
        'title'        => 'Database migration task',
        'description'  => '',
        'type'         => Issue::TYPE_TASK,
        'status_label' => '01900000-0000-7003-8000-000000000003', // In Progress
        'priority'     => Issue::PRIORITY_CRITICAL,
        'created_by'   => '01900000-0000-7000-8000-000000000001',
        'updated_by'   => null,
        'assigned_to'  => '01900000-0000-7000-8000-000000000001',
        'created_at'   => 1402312317,
        'updated_at'   => null,
        'closed_at'    => null,
        'due_date'     => null,
        'is_archived'  => true,
        'is_draft'     => false,
    ],
];
