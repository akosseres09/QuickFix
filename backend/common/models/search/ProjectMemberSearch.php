<?php

namespace common\models\search;

use common\models\ProjectMember;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\data\ActiveDataProvider;

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
        $projectId = Yii::$app->request->get('project_id');

        if (!$projectId) {
            throw new \yii\web\BadRequestHttpException('Project ID is required.');
        }

        $query = ProjectMember::find();

        // by UUID
        $query->byProjectId($projectId);

        return new ActiveDataProvider([
            'query' => $query,
        ]);
    }
}