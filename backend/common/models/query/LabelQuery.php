<?php

namespace common\models\query;

use yii\db\ActiveQuery;

class LabelQuery extends ActiveQuery
{
    public function all($db = null)
    {
        return parent::all($db);
    }

    public function one($db = null)
    {
        return parent::one($db);
    }

    public function byId($id): self
    {
        return $this->andWhere(["{{%label}}.id" => $id]);
    }

    public function byProjectId(string $projectId): self
    {
        return $this->andWhere(['{{%label}}.project_id' => $projectId]);
    }

    public function allForProject(string $projectId): self
    {
        return $this->andWhere([
            'or',
            ['{{%label}}.project_id' => $projectId],
            ['{{%label}}.project_id' => null]
        ]);
    }

    public function byLabel(string $label): self
    {
        return $this->andWhere(['{{%label}}.name' => $label]);
    }

    public function statusOpen(): self
    {
        return $this->andWhere(['{{%label}}.name' => 'Open', '{{%label}}.project_id' => null]);
    }

    public function statusClosed(): self
    {
        return $this->andWhere(['{{%label}}.name' => 'Closed', '{{%label}}.project_id' => null]);
    }
}
