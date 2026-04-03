<?php

namespace api\controllers;

use api\components\permissions\PermissionService;
use common\models\OrganizationMember;
use common\models\search\OrganizationMemberSearch;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class OrganizationMemberController extends BaseRestController
{
    public $modelClass = OrganizationMember::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors["projectTranslator"]);
        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        $actions['index']['prepareDataProvider'] = function () {
            $searchModel = new OrganizationMemberSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };

        $actions['view']['findModel'] = [$this, 'findModel'];
        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function checkAccess($action, $model = null, $params = [])
    {
        $userId = Yii::$app->user->id;
        $orgId = Yii::$app->request->get('organization_id');

        if (!$orgId) {
            return;
        }

        switch ($action) {
            case 'index':
            case 'view':
                if (!PermissionService::canViewOrgMembers($orgId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view organization members.');
                }
                break;
            case 'update':
            case 'delete':
                if (!PermissionService::canManageOrgMembers($orgId, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to manage organization members.');
                }
                break;
        }
    }

    public function findModel($id)
    {
        $orgId = Yii::$app->request->get('organization_id');

        if (!$orgId) {
            throw new BadRequestHttpException('Organization ID is required!');
        }
        $query = OrganizationMember::find()->byOrganization($orgId);

        if (Uuid::isValid($id)) {
            $query->byId($id);
        } else {
            $query->byUsername($id);
        }

        $orgMember = $query->one();
        if (!$orgMember) {
            throw new NotFoundHttpException('The requested organization member is not found!');
        }

        return $orgMember;
    }
}
