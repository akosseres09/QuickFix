<?php

namespace api\controllers;

use common\models\OrganizationMember;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\web\NotFoundHttpException;

class UserController extends BaseRestController
{
    public $modelClass = UserResource::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors["projectTranslator"], $behaviors["organizationTranslator"]);
        return $behaviors;
    }

    public function actions()
    {
        $actions = parent::actions();
        $actions["view"]["findModel"] = [$this, "findModel"];
        $actions["update"]["findModel"] = [$this, "findModel"];
        $actions["delete"]["findModel"] = [$this, "findModel"];

        return $actions;
    }

    public function findModel($id)
    {
        $query = UserResource::find();

        $isValidUuid = Uuid::isValid($id);
        if ($isValidUuid) {
            $query->byId($id);
        } else if (str_contains($id, "@")) {
            $query->byEmail($id);
        } else {
            $query->byUsername($id);
        }

        $model = $query->one();
        if (!$model) {
            throw new NotFoundHttpException("User not found");
        }

        return $model;
    }
}
