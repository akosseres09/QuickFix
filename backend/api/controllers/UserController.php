<?php

namespace api\controllers;

use common\models\resource\UserResource;

class UserController extends BaseRestController
{
    public $modelClass = UserResource::class;

    public function findModel($id)
    {
    }
}
