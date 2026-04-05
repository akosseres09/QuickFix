<?php

use yii\helpers\ArrayHelper;

$config = ArrayHelper::merge(
    require __DIR__ . '/main.php',
    require __DIR__ . '/main-local.php',
    require __DIR__ . '/test.php',
    require __DIR__ . '/test-local.php',
);

// Merge params separately to avoid crashing when params-local.php doesn't exist.
$params = require __DIR__ . '/params.php';
if (is_file(__DIR__ . '/params-local.php')) {
    $params = ArrayHelper::merge($params, require __DIR__ . '/params-local.php');
}
$config['params'] = $params;

// Remove services that require Redis/Queue daemon from bootstrap so tests
// run without external services.
$config['bootstrap'] = ['log'];

// Replace Redis cache with a file-based implementation.
$config['components']['cache'] = [
    'class' => \yii\caching\FileCache::class,
];

// Required by yii\web\User::login() → yii\web\Request cookie handling.
$config['components']['request']['cookieValidationKey'] = 'test-cookie-validation-key';

return $config;
