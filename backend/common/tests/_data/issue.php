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
        'created_at'   => time() - 60 * 60 * 24 * 5, // Created 5 days ago
        'updated_at'   => time() - 60 * 60 * 24 * 1, // Updated 1 day ago
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
        'created_at'   => time() - 60 * 60 * 24 * 2, // Created 2 days ago
        'updated_at'   => time() - 60 * 60 * 24 * 1,
        'closed_at'    => null,
        'due_date'     => null,
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
        'created_at'   => time() - 60 * 60 * 24 * 15, // Created 15 days ago
        'updated_at'   => null,
        'closed_at'    => null,
        'due_date'     => null,
        'is_archived'  => true,
        'is_draft'     => false,
    ],
    [
        'id'           => '01900000-0000-7004-8000-000000000004',
        'project_id'   => '01900000-0000-7002-8000-000000000001',
        'issue_key'    => 'TEST-4',
        'title'        => 'Database migration task 2',
        'description'  => '',
        'type'         => Issue::TYPE_TASK,
        'status_label' => '01900000-0000-7003-8000-000000000002', // Closed
        'priority'     => Issue::PRIORITY_CRITICAL,
        'created_by'   => '01900000-0000-7000-8000-000000000001',
        'updated_by'   => null,
        'assigned_to'  => '01900000-0000-7000-8000-000000000001',
        'created_at'   => time() - 60 * 60 * 24 * 10, // Created 10 days ago
        'updated_at'   => null,
        'closed_at'    => time() - 60 * 60 * 24 * 3, // Closed 3 days ago
        'due_date'     => null,
        'is_archived'  => true,
        'is_draft'     => false,
    ],
];
