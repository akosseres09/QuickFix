<?php

namespace api\controllers;

use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\Response;

class BaseRestController extends ActiveController
{
    public $serializer = [
        'class' => 'yii\rest\Serializer',
        'collectionEnvelope' => 'items',
        'metaEnvelope' => '_meta',
        'linksEnvelope' => '_links',
    ];

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        $auth = $behaviors['authenticator'];
        unset($behaviors['authenticator']);

        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['http://localhost:4200'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['*'],
                'Access-Control-Allow-Credentials' => true,
            ],
        ];

        $auth['class'] = \yii\filters\auth\HttpBearerAuth::class;
        $auth['except'] = ['options'];
        $behaviors['authenticator'] = $auth;

        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;

        return $behaviors;
    }
}
