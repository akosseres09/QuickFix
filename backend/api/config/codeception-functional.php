<?php

use yii\helpers\ArrayHelper;

return ArrayHelper::merge(
    require __DIR__ . '/main.php',
    require __DIR__ . '/test-local.php',
    [
        'id' => 'app-api-functional-tests',
        'bootstrap' => ['log'],
        'components' => [
            'request' => [
                // Tell the CLI environment what our base URL is so routing works
                'hostInfo' => 'http://api.quickfix.test',
                'scriptUrl' => '/index.php',
            ],
            'cache' => [
                'class' => \yii\caching\FileCache::class,
            ],
            'queue' => [
                'class' => \yii\queue\sync\Queue::class,
                'handle' => false, // Prevents tests from hanging on async tasks
            ],
            'mailer' => [
                'class' => \yii\symfonymailer\Mailer::class,
                'viewPath' => '@common/mail',
                'useFileTransport' => true, // Prevents real emails from sending
            ],
        ],
    ]
);
