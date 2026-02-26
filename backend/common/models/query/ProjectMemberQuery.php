<?php

namespace common\models\query;

use common\models\ProjectMember;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * This is the ActiveQuery class for [[ProjectMember]].
 *
 * @see ProjectMember
 */
class ProjectMemberQuery extends ActiveQuery
{
    public function all($db = null): array
    {
        return parent::all($db);
    }

    public function one($db = null): ActiveRecord|ProjectMember|null
    {
        return parent::one($db);
    }


    public function byProjectId(string $project_id): ProjectMemberQuery
    {
        return $this->andWhere(['project_id' => $project_id]);
    }

    public function byProjectKey(string $projectKey): ProjectMemberQuery
    {
        return $this->joinWith('project')->andWhere(['project.key' => $projectKey]);
    }

    /**
     * Filter by user
     * @param string $userId
     * @return ProjectMemberQuery
     */
    public function byUser(string $userId): ProjectMemberQuery
    {
        return $this->andWhere(['user_id' => $userId]);
    }

    /**
     * Filter by role
     * @param string $role
     * @return ProjectMemberQuery
     */
    public function byRole(string $role): ProjectMemberQuery
    {
        return $this->andWhere(['role' => $role]);
    }

    /**
     * Filter admin members
     * @return ProjectMemberQuery
     */
    public function admins(): ProjectMemberQuery
    {
        return $this->andWhere(['role' => ProjectMember::ROLE_ADMIN]);
    }

    /**
     * Filter regular members
     * @return ProjectMemberQuery
     */
    public function members(): ProjectMemberQuery
    {
        return $this->andWhere(['role' => ProjectMember::ROLE_MEMBER]);
    }

    /**
     * Order by creation date (newest first)
     * @return ProjectMemberQuery
     */
    public function latest(): ProjectMemberQuery
    {
        return $this->orderBy(['created_at' => SORT_DESC]);
    }

    /**
     * Order by creation date (oldest first)
     * @return ProjectMemberQuery
     */
    public function oldest(): ProjectMemberQuery
    {
        return $this->orderBy(['created_at' => SORT_ASC]);
    }
}
