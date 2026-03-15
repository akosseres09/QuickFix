<?php

namespace api\controllers;

use common\models\OrganizationInvitation;
use common\models\search\OrganizationInvitationSearch;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
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
        $action = Yii::$app->controller->action->id;
        $actionsRequiringPendingStatus = ['update', 'delete'];

        if (Uuid::isValid($id)) {
            $query->byId($id);
        } else {
            throw new BadRequestHttpException('Invalid invitation ID format.');
        }

        $inv = $query->byEmail(Yii::$app->user->identity->email)->one();
        if (!$inv) {
            throw new NotFoundHttpException('Organization invitation not found.');
        }

        if ($inv->isExpired()) {
            throw new ForbiddenHttpException('Organization invitation has expired.');
        }

        if (in_array($action, $actionsRequiringPendingStatus) && !$inv->isPending()) {
            throw new ForbiddenHttpException('Only pending invitations can be updated or deleted.');
        }

        return $inv;
    }
}
