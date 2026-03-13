<?php

namespace api\controllers;

use common\models\OrganizationInvitation;
use common\models\search\OrganizationInvitationSearch;
use Symfony\Component\Uid\Uuid;
use Yii;
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

        $actions['index']['prepareDataProvider'] = function () {
            $searchModel = new OrganizationInvitationSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };
        $actions['view']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];
        $actions['update']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function findModel($id)
    {
        $query = OrganizationInvitation::find();

        if (Uuid::isValid($id)) {
            $query->byId($id);
        } else {
            $query->byToken($id);
        }

        $inv = $query->byEmail(Yii::$app->user->identity->email)->one();
        if (!$inv) {
            throw new NotFoundHttpException('Organization invitation not found.');
        }

        if ($inv->isExpired()) {
            throw new NotFoundHttpException('Organization invitation has expired.');
        }

        return $inv;
    }
}
