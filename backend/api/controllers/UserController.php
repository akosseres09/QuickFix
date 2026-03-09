<?php

namespace api\controllers;

use common\models\resource\UserResource;

class UserController extends BaseRestController
{
    public $modelClass = UserResource::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors["projectTranslator"], $behaviors["organizationTranslator"]);

        return $behaviors;
    }

    public function findModel($id)
    {
    }
}
