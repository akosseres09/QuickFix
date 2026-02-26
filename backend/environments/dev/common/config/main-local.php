<?php

use yii\redis\Cache;
use yii\redis\Connection;


return [
    'components' => [
        'db' => [
            'class' => \yii\db\Connection::class,
            'dsn' => 'pgsql:host=db;dbname=quickfix',
            'username' => '', // fill in with your username
            'password' => '', // fill in with your password
            'charset' => 'utf8',
        ],
        'cache' => [
            'class' => Cache::class,
            'redis' => [
                'class' => Connection::class,
                'hostname' => 'redis',
                'port' => 6379,
                'database' => 0,
            ]
        ],
        'mailer' => [
            'class' => \yii\symfonymailer\Mailer::class,
            'viewPath' => '@common/mail',
            // send all mails to a file by default.
            'useFileTransport' => true,
            // You have to set
            //
            // 'useFileTransport' => false,
            //
            // and configure a transport for the mailer to send real emails.
            //
            // SMTP server example:
            //    'transport' => [
            //        'scheme' => 'smtps',
            //        'host' => '',
            //        'username' => '',
            //        'password' => '',
            //        'port' => 465,
            //        'dsn' => 'native://default',
            //    ],
            //
            // DSN example:
            //    'transport' => [
            //        'dsn' => 'smtp://user:pass@smtp.example.com:25',
            //    ],
            //
            // See: https://symfony.com/doc/current/mailer.html#using-built-in-transports
            // Or if you use a 3rd party service, see:
            // https://symfony.com/doc/current/mailer.html#using-a-3rd-party-transport
        ],
    ],
];
