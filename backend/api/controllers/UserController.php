<?php

namespace api\controllers;

use common\models\User;

class UserController extends BaseRestController
{
    public $modelClass = User::class;
}