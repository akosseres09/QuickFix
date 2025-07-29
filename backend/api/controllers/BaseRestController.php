<?php

namespace api\controllers;

use yii\rest\ActiveController;
use yii\web\Response;

class BaseRestController extends ActiveController
{
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;
        return $behaviors;
    }
}