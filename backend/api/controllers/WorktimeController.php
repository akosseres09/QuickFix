<?php

namespace api\controllers;

use common\models\search\WorktimeSearch;
use common\models\Worktime;
use Yii;

class WorktimeController extends BaseRestController
{
    public $modelClass = Worktime::class;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        unset($behaviors["projectTranslator"]);
        $behaviors["organizationTranslator"]["actions"] = ["index", "update", "delete", "create"];

        return $behaviors;
    }

    public function actions(): array
    {
        $actions = parent::actions();

        $actions["index"]['prepareDataProvider'] = function () {
            $searchModel = new WorktimeSearch();
            return $searchModel->search(Yii::$app->request->queryParams);
        };

        $actions['update']['findModel'] = [$this, 'findModel'];
        $actions['delete']['findModel'] = [$this, 'findModel'];

        return $actions;
    }

    public function findModel($id)
    {
        return Worktime::find()->byId($id)->one();
    }
}