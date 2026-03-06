<?php

namespace api\filters;

use common\models\Organization;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\base\ActionFilter;
use yii\web\NotFoundHttpException;

class OrganizationSlugTranslatorFilter extends ActionFilter
{
    public $identifierParamName = "organization_id";
    public $actions = ['index', 'view', 'update', 'delete', 'create']; // Actions to apply the filter to

    public function beforeAction($action)
    {
        if (!in_array($action->id, $this->actions)) {
            return parent::beforeAction($action);
        }

        $request = Yii::$app->getRequest();
        $organizationSlug = $request->get($this->identifierParamName);

        if (!Uuid::isValid($organizationSlug)) {
            $organizationId = Yii::$app->cache->getOrSet(Organization::getSlugToIdCache($organizationSlug), function () use ($organizationSlug) {
                return Organization::find()->select('id')->bySlug($organizationSlug)->scalar();
            });

            if (!$organizationId) {
                throw new NotFoundHttpException('Organization not found for slug: ' . $organizationSlug);
            }

            $request->setQueryParams(
                array_merge(
                    $request->getQueryParams(),
                    [$this->identifierParamName => $organizationId]
                )
            );
        }

        return parent::beforeAction($action);
    }
}