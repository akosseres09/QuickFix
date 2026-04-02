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
        'id'         => '00000000-0000-0000-0000-000000000001',
        'user_id'    => '01900000-0000-0000-0000-000000000001',
        'token'      => 'valid-refresh-token-000000000000',
        'ip'         => '127.0.0.1',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => 1700000000,
        'expires_at' => 1800000000, // far future
        'revoked_at' => null,
    ],
    // An expired, non-revoked token — for testing that createRefreshToken calls updateRefreshTokenExpiry
    'expired_token' => [
        'id'         => '00000000-0000-0000-0000-000000000002',
        'user_id'    => '01900000-0000-0000-0000-000000000002',
        'token'      => 'expired-refresh-token-000000000001',
        'ip'         => '127.0.0.1',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => 1700000000,
        'expires_at' => 1000000000, // past
        'revoked_at' => null,
    ],
    'revoked_token' => [
        'id'         => '00000000-0000-0000-0000-000000000003',
        'user_id'    => '01900000-0000-0000-0000-000000000001',
        'token'      => 'revoked-refresh-token-000000000002',
        'ip'         => '127.0.0.2',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => 1700000000,
        'expires_at' => 1800000000, // far future
        'revoked_at' => 1700000000, // revoked
    ],
    'revoked_expired_token' => [
        'id'         => '00000000-0000-0000-0000-000000000004',
        'user_id'    => '01900000-0000-0000-0000-000000000002',
        'token'      => 'revoked-expired-refresh-token-000000000003',
        'ip'         => '127.0.0.3',
        'user_agent' => 'TestAgent/1.0',
        'created_at' => 1700000000,
        'expires_at' => 1700000000, // past
        'revoked_at' => 1700000000, // revoked
    ],
];
