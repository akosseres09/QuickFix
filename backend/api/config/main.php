<?php

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/../../common/config/params-local.php',
    require __DIR__ . '/params.php',
    require __DIR__ . '/params-local.php'
);

return [
    'id' => 'app-api',
    'basePath' => dirname(__DIR__),
    'controllerNamespace' => 'api\controllers', // Points directly to the api/controllers directory
    'bootstrap' => ['log'],
    // The 'modules' section has been removed
    'components' => [
        'request' => [
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
        ],
        'response' => [
            'format' => yii\web\Response::FORMAT_JSON,
            'charset' => 'UTF-8',
        ],
        'user' => [
            'identityClass' => 'common\models\User',
            'enableAutoLogin' => false,
            'enableSession' => false,
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    'logFile' => '@api/runtime/logs/app.log',
                ],
            ],
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'enableStrictParsing' => true,
            'showScriptName' => false,
            'rules' => [
                [
                    'class' => 'yii\rest\UrlRule',
                    // The controller paths are now simpler, without the 'v1/' prefix
                    'controller' => ['user', 'auth'], // Add your controllers here
                    'pluralize' => false
                ],
                'auth/login' => 'auth/login',
                'auth/signup' => 'auth/signup',
                'auth/logout' => 'auth/logout',
                'auth/verify' => 'auth/verify',
                'auth/resend-verification-email' => 'auth/resend-verification-email',
                'auth/reset-password' => 'auth/reset-password',

            ],
        ],
    ],
    'params' => $params
];
