<?php

namespace common\models\query;

use yii\db\ActiveQuery;

class CommentQuery extends ActiveQuery {
    public function all($db = null) {
        return parent::all($db);
    }

    public function one($db = null) {
        return parent::one($db);
    }

    public function byIssueId(string $issueId) {
        return $this->andWhere(['issue_id' => $issueId]);
    }

    public function byId(string $id) {
        return $this->andWhere(['id'=> $id]);
    }

    public function byCreatorId(string $creatorId) {
        return $this->andWhere(['created_by' => $creatorId]);
    }

    public function byUpdatorId(string $updatorId) {
        return $this->andWhere(['updated_by' => $updatorId]);
    }

    /**
     * Searches comments by project_id or project key
     * @param string $projectIdentifier
     * @return CommentQuery
     */
    public function byProject(string $projectIdentifier) {
        return $this->joinWith('issue.project')->andWhere(
            ['or', 
            ['project.id' => $projectIdentifier], 
            ['project.key' => $projectIdentifier]]
        );
    }
}