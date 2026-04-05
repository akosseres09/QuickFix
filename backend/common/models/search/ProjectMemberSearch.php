<?php

namespace common\models\search;

use common\components\traits\EagerExpandTrait;
use common\models\Project;
use common\models\ProjectMember;
use Yii;
use yii\data\ActiveDataProvider;
use yii\db\Expression;
use yii\web\BadRequestHttpException;

class ProjectMemberSearch extends ProjectMember implements SearchInterface
{
    use EagerExpandTrait;
    public $username;
    public function rules(): array
    {
        return [
            [['id', 'project_id', 'user_id'], 'string', 'max' => 36],
            ['username', 'string'],
            [['role'], 'integer'],
        ];
    }

    public function search($params): ActiveDataProvider
    {
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 30);

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required.');
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            throw new BadRequestHttpException('Project ID is required.');
        }

        $project = Project::find()->byOrganizationId($organizationId)
            ->byId($projectId)->one();

        if (!$project) {
            throw new BadRequestHttpException('Project does not exist in the specified organization.');
        }

        $cursor = $params['cursor'] ?? null;

        if ($project->visibility === Project::VISIBILITY_PUBLIC) {
            $memberIdExpr = new Expression('COALESCE(pm.id, om.id)');

            // Public projects show all organization members with project role override when present.
            $query = ProjectMember::find()
                ->alias('pm')
                ->select([
                    'id' => $memberIdExpr,
                    'project_id' => new Expression(':projectId', [':projectId' => $projectId]),
                    'user_id' => 'om.user_id',
                    'role' => new Expression('COALESCE(pm.role, om.role)'),
                    'created_at' => new Expression('COALESCE(pm.created_at, om.created_at)'),
                ])
                ->rightJoin('{{%organization_member}} om', 'om.user_id = pm.user_id AND pm.project_id = :projectId', [':projectId' => $projectId])
                ->andWhere(['om.organization_id' => $organizationId]);
            $query->leftJoin('{{%user}}', '{{%user}}.id = om.user_id');

            if ($cursor) {
                $query->andWhere(new Expression('COALESCE(pm.id, om.id) > :cursor', [':cursor' => $cursor]));
            }

            $query->orderBy(new Expression('COALESCE(pm.id, om.id) ASC'));
        } else {
            $query = ProjectMember::find()->byProjectId($projectId);
            $query->leftJoin('{{%user}}', '{{%user}}.id = {{%project_member}}.user_id');
            if ($cursor) {
                $query->byCursor($cursor);
            }

            $query->orderBy(['{{%project_member}}.id' => SORT_ASC]);
        }

        $this->applyExpand($query);
        $query->limit($pageSize + 1);

        $dataprovider = new ActiveDataProvider([
            'query' => $query,
            'sort' => false,
            'pagination' => false,
        ]);

        $this->load($params, '');
        if (!$this->validate()) {
            return $dataprovider;
        }

        $query->andFilterWhere(['like', '{{%user}}.username', $this->username]);

        $models = $query->all();
        $hasMore = 'false';

        if (count($models) > $pageSize) {
            $hasMore = 'true';
            array_pop($models);
        }

        $headers = Yii::$app->response->headers;
        if (!empty($models)) {
            $dataprovider->setModels($models);

            $lastModel = end($models);

            $headers->set('X-Next-Cursor', $lastModel->id);
            $headers->set('X-Has-More', $hasMore);
        } else {
            $headers->set('X-Has-More', 'false');
        }

        return $dataprovider;
    }
}
