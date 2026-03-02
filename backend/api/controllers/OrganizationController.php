<?php

namespace api\controllers;

use api\filters\OrganizationSlugTranslatorFilter;
use common\models\Organization;
use common\models\search\OrganizationSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class OrganizationController extends BaseRestController
{
    public $modelClass = Organization::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors["organizationTranslator"] = [
            'class' => OrganizationSlugTranslatorFilter::class,
            'identifierParamName' => 'id',
            'actions' => ['view', 'update', 'delete']
        ];

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