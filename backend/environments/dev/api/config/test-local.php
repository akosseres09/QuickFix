<?php

return [
    'components' => [
        'db' => [
            'class' => \yii\db\Connection::class,
            'dsn' => 'pgsql:host=db;dbname=quickfix_test',
            'username' => '', // fill in with your username
            'password' => '', // fill in with your password
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
