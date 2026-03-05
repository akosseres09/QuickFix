<?php

namespace api\controllers;

use api\filters\OrganizationSlugTranslatorFilter;
use common\models\OrganizationMember;
use common\models\search\OrganizationMemberSearch;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class OrganizationMemberController extends BaseRestController
{
    public $modelClass = OrganizationMember::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors["organizationTranslator"] = [
            'class' => OrganizationSlugTranslatorFilter::class,
        ];

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

    public function findModel($id)
    {
        $orgId = Yii::$app->request->get('organization_id');
        if (!$orgId) {
            throw new BadRequestHttpException('Organization ID is required!');
        }

        $orgMember = OrganizationMember::find()->byId($id)->byOrganization($orgId)->one();
        if (!$orgMember) {
            throw new NotFoundHttpException('The requested organization is not found!');
        }

        return $orgMember;
    }
}