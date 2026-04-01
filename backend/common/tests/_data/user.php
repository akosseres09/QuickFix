<?php

use common\models\UserRole;
use common\models\UserStatus;

return [
    [
        'id'           => '01900000-0000-0000-0000-000000000001',
        'username'     => 'bayer.hudson',
        'first_name'   => 'Hudson',
        'last_name'    => 'Bayer',
        'auth_key'     => 'HP187Mvq7Mmm3CTU80dLkGmni_FUH_lR',
        // password_0
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => 'ExzkCOaYc1L8IOBs4wdTGGbgNiG3Wz1I_1402312317',
        'verification_token'    => null,
        'email'        => 'nicole.paucek@schultz.info',
        'status'       => UserStatus::ACTIVE->value,
        'is_admin'     => UserRole::USER->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
        'password_reset_token_expires_at' => 1802312317
    ],
    [
        'id'           => '01900000-0000-0000-0000-000000000002',
        'username'     => 'jane.doe',
        'first_name'   => 'Jane',
        'last_name'    => 'Doe',
        'auth_key'     => 'testAuthKey222222222222222222222',
        'verification_token'    => 'testVerificationToken22222222222222222222',
        // password_0
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => 'ExzkCOaYc1L8IOBs4wdTGGbgNiG3Wz1I_1402312318',
        'email'        => 'jane.doe@example.com',
        'status'       => UserStatus::INACTIVE->value,
        'is_admin'     => UserRole::USER->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
    ],
    [
        'id'           => '01900000-0000-0000-0000-000000000003',
        'username'     => 'admin.user',
        'first_name'   => 'Admin',
        'last_name'    => 'Super',
        'auth_key'     => 'adminAuthKey33333333333333333333',
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => null,
        'verification_token'    => null,
        'email'        => 'admin@example.com',
        'status'       => UserStatus::ACTIVE->value,
        'is_admin'     => UserRole::ADMIN->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
    ],
    [
        'id'           => '01900000-0000-0000-0000-000000000004',
        'username'     => 'deleted.user',
        'first_name'   => 'Deleted',
        'last_name'    => 'User',
        'auth_key'     => 'deletedAuthKey44444444444444444',
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => null,
        'verification_token'    => null,
        'email'        => 'deleted@example.com',
        'status'       => UserStatus::DELETED->value,
        'is_admin'     => UserRole::USER->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
        'deleted_at'   => 1402312400,
    ],
    [
        'id'           => '01900000-0000-0000-0000-000000000005',
        'username'     => 'not-part-of-any-organization',
        'first_name'   => 'Not',
        'last_name'    => 'PartOfAnyOrganization',
        'auth_key'     => 'HP187Mvq7Mmm3CTU80dLkGmni_FUH_lR',
        // password_0
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => null,
        'verification_token'    => null,
        'email'        => 'not.part.of.any.organization@example.com',
        'status'       => UserStatus::ACTIVE->value,
        'is_admin'     => UserRole::USER->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
    ],
    [
        'id'           => '01900000-0000-0000-0000-000000000006',
        'username'     => 'expired.password.token',
        'first_name'   => 'Expired',
        'last_name'    => 'Token',
        'auth_key'     => 'HP187Mvq7Mmm3CTU80dLkGmni_FUH_lL',
        // password_0
        'password_hash'         => '$2y$13$EjaPFBnZOQsHdGuHI.xvhuDp1fHpo8hKRSk6yshqa9c5EG8s3C3lO',
        'password_reset_token'  => 'expiredToken1234567890',
        'password_reset_token_expires_at' => time() - 3600, // Set token to expired
        'verification_token'    => null,
        'email'        => 'expired.password.token@example.com',
        'status'       => UserStatus::ACTIVE->value,
        'is_admin'     => UserRole::USER->value,
        'created_at'   => 1402312317,
        'updated_at'   => 1402312317,
    ]
];
