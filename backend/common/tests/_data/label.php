<?php

// Depends on: project.php (project_id)
// Note: Label has no timestamp / blameable behavior — no created_at / updated_at.

return [
    [
        'id'          => '01900000-0000-0003-0000-000000000001',
        'project_id'  => '01900000-0000-0002-0000-000000000001',
        'name'        => 'Open',
        'description' => 'Issue is open and active.',
        'index'       => 1,
        'color'       => '#22c55e',
    ],
    [
        'id'          => '01900000-0000-0003-0000-000000000002',
        'project_id'  => '01900000-0000-0002-0000-000000000001',
        'name'        => 'Closed',
        'description' => 'Issue has been resolved.',
        'index'       => 2,
        'color'       => '#ef4444',
    ],
];
