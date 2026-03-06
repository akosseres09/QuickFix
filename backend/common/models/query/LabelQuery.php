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
        return $this->andWhere(["label.id" => $id]);
    }

    public function byProjectId(string $projectId): self
    {
        return $this->andWhere(['label.project_id' => $projectId]);
    }

    public function byLabel(string $label): self
    {
        return $this->andWhere(['label.name' => $label]);
    }
}