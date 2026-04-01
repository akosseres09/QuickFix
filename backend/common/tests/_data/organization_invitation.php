<?php

// Depends on: organization.php, user.php
// Note: Tests that instantiate OrganizationInvitation models directly need
// a 'jwt' component in the app config (the model calls Yii::$app->get('jwt')
// in init()). Loading this fixture via raw SQL insert is safe without jwt.

use api\components\permissions\RoleManager;
use common\models\OrganizationInvitation;

return [
    [
        'id'              => '01900000-0000-0009-0000-000000000001',
        'organization_id' => '01900000-0000-0001-0000-000000000001',
        'inviter_id'      => '01900000-0000-0000-0000-000000000001',
        'email'           => 'invited@example.com',
        'role'            => RoleManager::ROLE_MEMBER,
        'status'          => OrganizationInvitation::STATUS_PENDING,
        'expires_at'      => 1893456000, // far-future unix timestamp
        'created_at'      => 1402312317,
        'updated_at'      => 1402312317,
    ],
    [
        'id'              => '01900000-0000-0009-0000-000000000002',
        'organization_id' => '01900000-0000-0001-0000-000000000001',
        'inviter_id'      => '01900000-0000-0000-0000-000000000001',
        'email'           => 'accepted@example.com',
        'role'            => RoleManager::ROLE_MEMBER,
        'status'          => OrganizationInvitation::STATUS_ACCEPTED,
        'expires_at'      => 1893456000,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312400,
    ],
    [
        'id'              => '01900000-0000-0009-0000-000000000003',
        'organization_id' => '01900000-0000-0001-0000-000000000001',
        'inviter_id'      => '01900000-0000-0000-0000-000000000001',
        'email'           => 'expired@example.com',
        'role'            => RoleManager::ROLE_GUEST,
        'status'          => OrganizationInvitation::STATUS_PENDING,
        'expires_at'      => 1402312317, // already expired
        'created_at'      => 1402312000,
        'updated_at'      => 1402312000,
    ],
    [
        'id'              => '01900000-0000-0009-0000-000000000004',
        'organization_id' => '01900000-0000-0001-0000-000000000001',
        'inviter_id'      => '01900000-0000-0000-0000-000000000001',
        'email'           => 'revoked@example.com',
        'role'            => RoleManager::ROLE_MEMBER,
        'status'          => OrganizationInvitation::STATUS_REVOKED,
        'expires_at'      => 1893456000,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312400,
    ],
    [
        'id'              => '01900000-0000-0009-0000-000000000005',
        'organization_id' => '01900000-0000-0001-0000-000000000001',
        'inviter_id'      => '01900000-0000-0000-0000-000000000001',
        'email'           => 'not.part.of.any.organization@example.com',
        'role'            => RoleManager::ROLE_MEMBER,
        'status'          => OrganizationInvitation::STATUS_PENDING,
        'expires_at'      => 1893456000,
        'created_at'      => 1402312317,
        'updated_at'      => 1402312400,
    ]
];
