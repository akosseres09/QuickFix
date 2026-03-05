<?php

namespace common\models\search;

use common\models\Project;
use common\models\ProjectMember;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;

class ProjectMemberSearch extends ProjectMember implements SearchInterface
{
    public function rules(): array
    {
        return [
            [['id', 'project_id', 'user_id'], 'string', 'max' => 36],
            [['role'], 'integer'],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $exists = Project::find()->byOrganizationId($organizationId)
            ->byId($projectId)->exists();

        if (!$exists) {
            throw new BadRequestHttpException('Project does not exist in the specified organization.');
        }

        $query = ProjectMember::find()->byProjectId($projectId);
        return new ActiveDataProvider([
            'query' => $query,
        ]);
    }
}