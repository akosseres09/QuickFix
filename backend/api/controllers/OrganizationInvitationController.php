<?php

namespace api\controllers;

use common\models\OrganizationInvitation;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class OrganizationInvitationController extends BaseRestController
{
    public $modelClass = OrganizationInvitation::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        unset($behaviors['projectTranslator']);

        return $behaviors;
    }

    public function actions()
    {
        $actions = parent::actions();

        unset($actions['index']);

        return $actions;
    }

    public function findModel($id)
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $inv = OrganizationInvitation::find()->byOrganization($organizationId)->byId($id)->one();
        if (!$inv) {
            throw new NotFoundHttpException('Organization invitation not found.');
        }

        return $inv;
    }
}
