<?php

return [
    'components' => [
        'db' => [
            'class' => \yii\db\Connection::class,
            'dsn' => 'pgsql:host=127.0.0.1;dbname=quickfix_test',
            'username' => 'quickfix_test_user', // fill in with your username
            'password' => 'quickfix_test_password', // fill in with your password
            'charset' => 'utf8',
        ],
        'jwt' => function () {
            $config = \Lcobucci\JWT\Configuration::forSymmetricSigner(
                new \Lcobucci\JWT\Signer\Hmac\Sha256(),
                \Lcobucci\JWT\Signer\Key\InMemory::plainText(Yii::$app->params['jwtSecret']),
            );
            $config->setValidationConstraints(
                new \Lcobucci\JWT\Validation\Constraint\SignedWith(
                    $config->signer(),
                    $config->signingKey()
                ),
                new \Lcobucci\JWT\Validation\Constraint\LooseValidAt(
                    \Lcobucci\Clock\SystemClock::fromUTC()
                )
            );
            return $config;
        }
    ],
];
