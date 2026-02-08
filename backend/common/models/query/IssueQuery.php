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

    public function byProject(string $projectId)
    {
        return $this->andWhere(['project_id' => $projectId]);
    }

    public function byStatus(int $status)
    {
        return $this->andWhere(['status' => $status]);
    }

    public function byType(int $type)
    {
        return $this->andWhere(['type' => $type]);
    }

    public function byPriority(int $priority)
    {
        return $this->andWhere(['priority' => $priority]);
    }

    public function assignedTo(string $userId)
    {
        return $this->andWhere(['assigned_to' => $userId]);
    }

    public function createdBy(string $userId)
    {
        return $this->andWhere(['created_by' => $userId]);
    }
}
