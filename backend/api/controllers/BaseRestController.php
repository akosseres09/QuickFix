<?php

namespace api\controllers;

use api\filters\OrganizationSlugTranslatorFilter;
use api\filters\ProjectKeyTranslatorFilter;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\Response;

abstract class BaseRestController extends ActiveController
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

        // you can unset or modify these translators in child controllers if not needed

        $behaviors['organizationTranslator'] = [
            'class' => OrganizationSlugTranslatorFilter::class
        ];

        $behaviors["projectTranslator"] = [
            'class' => ProjectKeyTranslatorFilter::class,
        ];

        return $behaviors;
    }

    abstract public function findModel($id);
}
