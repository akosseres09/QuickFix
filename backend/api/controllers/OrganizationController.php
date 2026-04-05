<?php

namespace api\controllers;

use api\components\permissions\OrganizationPermissionService;
use common\models\Organization;
use common\models\search\OrganizationSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

class OrganizationController extends BaseRestController
{
    public $modelClass = Organization::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors["projectTranslator"]);

        $behaviors["organizationTranslator"]['identifierParamName'] = 'id';
        $behaviors["organizationTranslator"]['actions'] = ['view', 'update', 'delete'];

        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        $actions['index']['prepareDataProvider'] = function () {
            $searchModel = new OrganizationSearch();
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

        switch ($action) {
            case 'view':
                if ($model && !OrganizationPermissionService::canViewOrganization($model->id, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to view this organization.');
                }
                break;
            case 'update':
                if ($model && !OrganizationPermissionService::canUpdateOrganization($model->id, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to update this organization.');
                }
                break;
            case 'delete':
                if ($model && !OrganizationPermissionService::canDeleteOrganization($model->id, $userId)) {
                    throw new ForbiddenHttpException('You do not have permission to delete this organization.');
                }
                break;
        }
    }

    public function findModel($id)
    {
        $orgId = Yii::$app->request->get('id');
        if (!$orgId) {
            throw new BadRequestHttpException('Organization ID is required!');
        }

        $org = Organization::findOne($orgId);
        if (!$org) {
            throw new NotFoundHttpException('The requested organization is not found!');
        }

        return $org;
    }
}
