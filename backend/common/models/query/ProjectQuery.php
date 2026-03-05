<?php

namespace common\models\query;

use common\models\Project;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * This is the ActiveQuery class for [[Project]].
 *
 * @see Project
 */
class ProjectQuery extends ActiveQuery
{
    public function all($db = null): array
    {
        return parent::all($db);
    }

    public function one($db = null): ActiveRecord|Project|null
    {
        return parent::one($db);
    }

    public function byId(string $id): ProjectQuery
    {
        return $this->andWhere(['id' => $id]);
    }

    public function byOrganizationId(string $organizationId): ProjectQuery
    {
        return $this->andWhere(['organization_id' => $organizationId]);
    }

    /**
     * Filter by active projects
     * @return ProjectQuery
     */
    public function active(): ProjectQuery
    {
        return $this->andWhere(['status' => Project::STATUS_ACTIVE]);
    }

    /**
     * Filter by completed projects
     * @return ProjectQuery
     */
    public function completed(): ProjectQuery
    {
        return $this->andWhere(['status' => Project::STATUS_COMPLETED]);
    }

    /**
     * Filter by on-hold projects
     * @return ProjectQuery
     */
    public function onHold(): ProjectQuery
    {
        return $this->andWhere(['status' => Project::STATUS_ON_HOLD]);
    }

    /**
     * Filter by status
     * @param string $status
     * @return ProjectQuery
     */
    public function byStatus(string $status): ProjectQuery
    {
        return $this->andWhere(['status' => $status]);
    }

    /**
     * Filter by owner
     * @param int $ownerId
     * @return ProjectQuery
     */
    public function byOwner(string $ownerId): ProjectQuery
    {
        return $this->andWhere(['owner_id' => $ownerId]);
    }

    /**
     * Filter by project key
     * @param string $key
     * @return ProjectQuery
     */
    public function byKey(string $key): ProjectQuery
    {
        return $this->andWhere(['key' => $key]);
    }

    /**
     * Filter by project key or ID
     * @param string $keyOrId
     * @return ProjectQuery
     */
    public function byKeyOrId(string $keyOrId): ProjectQuery
    {
        return $this->andWhere(['or', ['key' => $keyOrId], ['id' => $keyOrId]]);
    }

    /**
     * Filter by visibility
     * @param string $visibility
     * @return ProjectQuery
     */
    public function byVisibility(string $visibility): ProjectQuery
    {
        return $this->andWhere(['visibility' => $visibility]);
    }

    /**
     * Filter by public visibility
     * @return ProjectQuery
     */
    public function public(): ProjectQuery
    {
        return $this->andWhere(['visibility' => Project::VISIBILITY_PUBLIC]);
    }

    /**
     * Filter by private visibility
     * @return ProjectQuery
     */
    public function private(): ProjectQuery
    {
        return $this->andWhere(['visibility' => Project::VISIBILITY_PRIVATE]);
    }

    /**
     * Filter by priority
     * @param string $priority
     * @return ProjectQuery
     */
    public function byPriority(string $priority): ProjectQuery
    {
        return $this->andWhere(['priority' => $priority]);
    }

    /**
     * Filter by high priority (high and critical)
     * @return ProjectQuery
     */
    public function highPriority(): ProjectQuery
    {
        return $this->andWhere(['in', 'priority', [Project::PRIORITY_HIGH, Project::PRIORITY_CRITICAL]]);
    }

    /**
     * Order by creation date (newest first)
     * @return ProjectQuery
     */
    public function latest(): ProjectQuery
    {
        return $this->orderBy(['created_at' => SORT_DESC]);
    }

    /**
     * Order by name
     * @return ProjectQuery
     */
    public function orderByName(): ProjectQuery
    {
        return $this->orderBy(['name' => SORT_ASC]);
    }

    /**
     * Filter projects with end date in the future
     * @return ProjectQuery
     */
    public function upcoming(): ProjectQuery
    {
        return $this->andWhere(['>', 'end_date', date('Y-m-d')]);
    }

    /**
     * Filter projects with end date in the past
     * @return ProjectQuery
     */
    public function overdue(): ProjectQuery
    {
        return $this->andWhere(['<', 'end_date', date('Y-m-d')])
            ->andWhere(['!=', 'status', Project::STATUS_COMPLETED]);
    }
}
