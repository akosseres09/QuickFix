<?php

use yii\rest\UrlRule;

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/../../common/config/params-local.php',
    require __DIR__ . '/params.php',
    require __DIR__ . '/params-local.php'
);

return [
    'id' => 'quickfix-api',
    'basePath' => dirname(__DIR__),
    'controllerNamespace' => 'api\controllers', // Points directly to the api/controllers directory
    'bootstrap' => ['log'],
    // The 'modules' section has been removed
    'components' => [
        'request' => [
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
            'enableCookieValidation' => false, // Disable cookie validation for API
        ],
        'response' => [
            'format' => yii\web\Response::FORMAT_JSON,
            'charset' => 'UTF-8',
        ],
        'user' => [
            'identityClass' => 'common\models\User',
            'enableAutoLogin' => false,
            'enableSession' => false,
            'loginUrl' => null
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
                    'class' => UrlRule::class,
                    'controller' => ['auth'],
                    'pluralize' => false,
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['organization'],
                    'pluralize' => false,
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>',
                    ]
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['user'],
                    'pluralize' => false,
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>',
                    ]
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['project', 'organization-member', 'worktime'],
                    'pluralize' => false,
                    'prefix' => '<organization_id:[A-Za-z0-9_\-]+>',
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>',
                    ]
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['issue'],
                    'pluralize' => false,
                    'prefix' => '<organization_id:[A-Za-z0-9_\-]+>/<project_id:[A-Za-z0-9_\-]+>/',
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>',
                    ],
                    'extraPatterns' => [
                        'GET stats' => 'stats'
                    ]
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['member', 'label'],
                    'pluralize' => false,
                    'prefix' => '<organization_id:[A-Za-z0-9_\-]+>/<project_id:[A-Za-z0-9_\-]+>/',
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>',
                    ]
                ],
                [
                    'class' => UrlRule::class,
                    'controller' => ['comment'],
                    'pluralize' => false,
                    'prefix' => '<organization_id:[A-Za-z0-9_\-]+>/<project_id:[A-Za-z0-9_\-]+>/<issue_id:[A-Za-z0-9_\-]+>/',
                    'tokens' => [
                        '{id}' => '<id:[A-Za-z0-9_\-]+>'
                    ]
                ],
                'auth/login' => 'auth/login',
                'auth/signup' => 'auth/signup',
                'auth/logout' => 'auth/logout',
                'auth/verify' => 'auth/verify',
                'auth/resend-verification-email' => 'auth/resend-verification-email',
                'auth/reset-password' => 'auth/reset-password',
                'auth/refresh' => 'auth/refresh',
                'auth/me' => 'auth/me',
            ],
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
    'params' => $params
];
