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
    ],
];
