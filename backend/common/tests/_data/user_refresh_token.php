<?php

/**
 * Fixture data for user_refresh_token table.
 *
 * Users referenced (from user.php fixture):
 *   01900000-0000-0000-0000-000000000001  (active user)
 *   01900000-0000-0000-0000-000000000002  (inactive user)
 */
return [
    // A valid, non-revoked token — for testing that createRefreshToken returns it as-is
    'valid_token' => [
        'id'         => '00000000-0000-7000-8000-000000000001',
        'user_id'    => '01900000-0000-7000-8000-000000000001',
        'token'      => 'valid-refresh-token-000000000000',
        'ip'         => '127.0.0.1',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => time() - 7200, // 2 hours ago
        'expires_at' => time() + 7200, // 2 hours in the future
        'revoked_at' => null,
    ],
    // An expired, non-revoked token — for testing that createRefreshToken calls updateRefreshTokenExpiry
    'expired_token' => [
        'id'         => '00000000-0000-7000-8000-000000000002',
        'user_id'    => '01900000-0000-7000-8000-000000000002',
        'token'      => 'expired-refresh-token-000000000001',
        'ip'         => '127.0.0.1',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => time() - 7200, // 2 hours ago
        'expires_at' => time() - 3600, // 1 hour ago
        'revoked_at' => null,
    ],
    'revoked_token' => [
        'id'         => '00000000-0000-7000-8000-000000000003',
        'user_id'    => '01900000-0000-7000-8000-000000000001',
        'token'      => 'revoked-refresh-token-000000000002',
        'ip'         => '127.0.0.2',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => time() - 7200, // 2 hours ago
        'expires_at' => time() + 7200, // 2 hours in the future
        'revoked_at' => time() - 3600, // revoked 1 hour ago
    ],
    'revoked_expired_token' => [
        'id'         => '00000000-0000-7000-8000-000000000004',
        'user_id'    => '01900000-0000-7000-8000-000000000002',
        'token'      => 'revoked-expired-refresh-token-000000000003',
        'ip'         => '127.0.0.3',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => time() - 7200, // 2 hours ago
        'expires_at' => time() - 3600, // 1 hour ago
        'revoked_at' => time() - 3600, // 1 hour ago
    ],
    'user_does_not_exist' => [
        'id'         => '00000000-0000-7000-8000-000000000005',
        'user_id'    => '01900000-0000-7000-8000-100000000000', // non-existent user
        'token'      => 'non-existent-user-refresh-token-000000000004',
        'ip'         => '127.0.0.1',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => time() - 7200, // 2 hours ago
        'expires_at' => time() + 3600, // 1 hour ago
        'revoked_at' => null,
    ]
];
