<?php

namespace common\models\query;

use yii\db\ActiveQuery;

class WorktimeQuery extends ActiveQuery
{
    public function all($db = null)
    {
        return parent::all($db);
    }

    public function one($db = null)
    {
        return parent::one($db);
    }

    public function byId(string $id): self
    {
        return $this->andWhere(['{{%worktime}}.id' => $id]);
    }

    public function byIssueId(string $issueId): self
    {
        return $this->andWhere(['{{%worktime}}.issue_id' => $issueId]);
    }

    public function byProjectId(string $projectId): self
    {
        return $this->innerJoinWith('issue', false)
            ->andWhere(['{{%issue}}.project_id' => $projectId]);
    }

    public function byCreatedBy(string $userId): self
    {
        return $this->andWhere(['{{%worktime}}.created_by' => $userId]);
    }

    public function byOrganizationId(string $organizationId): self
    {
        return $this->innerJoinWith('issue', false)
            ->innerJoin('{{%project}}', '{{%project}}.id = issue.project_id')
            ->andWhere(['{{%project}}.organization_id' => $organizationId]);
    }
}