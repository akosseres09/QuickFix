<?php

namespace api\filters;

use common\models\Project;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\base\ActionFilter;

/**
 * Translates a project key from the request into a project ID and updates the request parameters accordingly.
 * This allows API endpoints to accept either a project key or a project ID for identifying the project, 
 * while internally using the project ID for processing.
 * 
 * Example usage:
 * In a controller, you can attach this filter to actions that require project identification:
 * ```php
 * public function behaviors()
 * {
 *     return [
 *         'projectKeyTranslator' => [
 *             'class' => ProjectKeyTranslatorFilter::class,
 *            'identifierParamName' => 'project_id', // Optional: specify the query parameter name
 *        ],
 *    ];
 * }
 * ```
 */
class ProjectKeyTranslatorFilter extends ActionFilter
{
    public $identifierParamName = "project_id";
    public $actions = ['index', 'view', 'update', 'delete', 'create']; // Actions to apply the filter to

    public function beforeAction($action): bool
    {
        if (!in_array($action->id, $this->actions)) {
            return parent::beforeAction($action);
        }

        $request = Yii::$app->getRequest();
        $projectKey = $request->get($this->identifierParamName);

        // if the project_id from the request is not a valid UUID, treat it as a project key and translate it to project ID
        if (!Uuid::isValid($projectKey)) {
            $projectId = Yii::$app->cache->getOrSet('project_key_to_id_' . $projectKey, function () use ($projectKey) {
                return Project::find()->select('id')->byKey($projectKey)->scalar();
            });

            if (!$projectId) {
                throw new \yii\web\NotFoundHttpException('Project not found for key: ' . $projectKey);
            }

            $request->setQueryParams(array_merge($request->getQueryParams(), [$this->identifierParamName => $projectId]));
        } else {
            throw new \yii\web\NotFoundHttpException('Invalid project identifier: ' . $projectKey);
        }

        return parent::beforeAction($action);
    }
}