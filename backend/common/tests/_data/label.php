<?php

// Depends on: project.php (project_id)
// Note: Label has no timestamp / blameable behavior — no created_at / updated_at.

use common\models\Label;

return [
    [
        'id'          => '01900000-0000-0003-0000-000000000001',
        'project_id'  => '01900000-0000-0002-0000-000000000001',
        'name'        => Label::STATUS_OPEN,
        'description' => 'Issue is open and active.',
        'index'       => 1,
        'color'       => '#22c55e',
    ],
    [
        'id'          => '01900000-0000-0003-0000-000000000002',
        'project_id'  => '01900000-0000-0002-0000-000000000001',
        'name'        => Label::STATUS_CLOSED,
        'description' => 'Issue has been resolved.',
        'index'       => 2,
        'color'       => '#ef4444',
    ],
    [
        'id'          => '01900000-0000-0003-0000-000000000003',
        'project_id'  => '01900000-0000-0002-0000-000000000001',
        'name'        => 'In Progress',
        'description' => 'Issue is being worked on.',
        'index'       => 3,
        'color'       => '#f59e0b',
    ],
    [
        'id'          => '01900000-0000-0003-0000-000000000004',
        'project_id'  => '01900000-0000-0002-0000-000000000002',
        'name'        => Label::STATUS_OPEN,
        'description' => 'Open label for private project.',
        'index'       => 1,
        'color'       => '#22c55e',
    ],
];
