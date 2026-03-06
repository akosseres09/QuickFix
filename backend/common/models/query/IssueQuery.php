<?php

namespace common\models\query;

use yii\db\ActiveQuery;

class IssueQuery extends ActiveQuery
{
    public function all($db = null)
    {
        return parent::all($db);
    }

    public function one($db = null)
    {
        return parent::one($db);
    }

    public function byProjectId(string $projectId)
    {
        return $this->andWhere(['issue.project_id' => $projectId]);
    }

    public function byId(string $id)
    {
        return $this->andWhere(['issue.id' => $id]);
    }

    public function byStatus(int $status)
    {
        return $this->andWhere(['issue.status' => $status]);
    }

    public function byType(int $type)
    {
        return $this->andWhere(['issue.type' => $type]);
    }

    public function byPriority(int $priority)
    {
        return $this->andWhere(['issue.priority' => $priority]);
    }

    public function assignedTo(string $userId)
    {
        return $this->andWhere(['issue.assigned_to' => $userId]);
    }

    public function createdBy(string $userId)
    {
        return $this->andWhere(['issue.created_by' => $userId]);
    }
}
