<?php

namespace common\tests\unit\models\query;

use Codeception\Test\Unit;
use common\fixtures\LabelFixture;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\fixtures\UserFixture;
use common\models\Project;
use common\models\query\ProjectQuery;

class ProjectQueryTest extends Unit
{
    protected $tester;

    public function _fixtures(): array
    {
        return [
            'user' => [
                'class'    => UserFixture::class,
                'dataFile' => codecept_data_dir() . 'user.php',
            ],
            'organization' => [
                'class'    => OrganizationFixture::class,
                'dataFile' => codecept_data_dir() . 'organization.php',
            ],
            'project' => [
                'class'    => ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
            ],
            'label' => [
                'class'    => LabelFixture::class,
                'dataFile' => codecept_data_dir() . 'label.php',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // byId
    // -------------------------------------------------------------------------

    public function testByIdReturnsMatchingProject(): void
    {
        $result = Project::find()
            ->byId('01900000-0000-0002-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->name)->equals('Test Project');
    }

    public function testByIdReturnsNullForUnknownId(): void
    {
        $result = Project::find()
            ->byId('00000000-0000-0000-0000-000000000000')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byOrganizationId
    // -------------------------------------------------------------------------

    public function testByOrganizationIdReturnsAllProjects(): void
    {
        $results = Project::find()
            ->byOrganizationId('01900000-0000-0001-0000-000000000001')
            ->all();

        // All 3 fixture projects belong to org1
        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->organization_id)->equals('01900000-0000-0001-0000-000000000001');
        }
    }

    public function testByOrganizationIdReturnsEmptyForUnknownOrg(): void
    {
        $results = Project::find()
            ->byOrganizationId('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // active / completed / onHold
    // -------------------------------------------------------------------------

    public function testActiveReturnsOnlyActiveProjects(): void
    {
        $results = Project::find()->active()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->status)->equals(Project::STATUS_ACTIVE);
        }
    }

    public function testCompletedReturnsOnlyCompletedProjects(): void
    {
        $results = Project::find()->completed()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->status)->equals(Project::STATUS_COMPLETED);
        }
    }

    public function testOnHoldReturnsOnlyOnHoldProjects(): void
    {
        $results = Project::find()->onHold()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->status)->equals(Project::STATUS_ON_HOLD);
        }
    }

    // -------------------------------------------------------------------------
    // byStatus
    // -------------------------------------------------------------------------

    public function testByStatusFiltersCorrectly(): void
    {
        $results = Project::find()
            ->byStatus(Project::STATUS_ACTIVE)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->status)->equals(Project::STATUS_ACTIVE);
        }
    }

    // -------------------------------------------------------------------------
    // byOwner
    // -------------------------------------------------------------------------

    public function testByOwnerReturnsProjectsForGivenOwner(): void
    {
        $results = Project::find()
            ->byOwner('01900000-0000-0000-0000-000000000001')
            ->all();

        // All 3 projects are owned by user 1
        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->owner_id)->equals('01900000-0000-0000-0000-000000000001');
        }
    }

    public function testByOwnerReturnsEmptyForUnknownOwner(): void
    {
        $results = Project::find()
            ->byOwner('00000000-0000-0000-0000-000000000000')
            ->all();

        verify($results)->empty();
    }

    // -------------------------------------------------------------------------
    // byKey
    // -------------------------------------------------------------------------

    public function testByKeyReturnsMatchingProject(): void
    {
        $result = Project::find()
            ->byKey('TEST')
            ->one();

        verify($result)->notNull();
        verify($result->id)->equals('01900000-0000-0002-0000-000000000001');
    }

    public function testByKeyReturnsNullForUnknownKey(): void
    {
        $result = Project::find()
            ->byKey('UNKNOWN')
            ->one();

        verify($result)->null();
    }

    // -------------------------------------------------------------------------
    // byKeyOrId
    // -------------------------------------------------------------------------

    public function testByKeyOrIdFindsProjectByKey(): void
    {
        $result = Project::find()
            ->byKeyOrId('PRIV')
            ->one();

        verify($result)->notNull();
        verify($result->key)->equals('PRIV');
    }

    public function testByKeyOrIdFindsProjectById(): void
    {
        $result = Project::find()
            ->byKeyOrId('01900000-0000-0002-0000-000000000001')
            ->one();

        verify($result)->notNull();
        verify($result->key)->equals('TEST');
    }

    // -------------------------------------------------------------------------
    // byVisibility
    // -------------------------------------------------------------------------

    public function testByVisibilityPublicReturnsPublicProjects(): void
    {
        $results = Project::find()
            ->byVisibility(Project::VISIBILITY_PUBLIC)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->visibility)->equals(Project::VISIBILITY_PUBLIC);
        }
    }

    public function testByVisibilityPrivateReturnsPrivateProjects(): void
    {
        $results = Project::find()
            ->byVisibility(Project::VISIBILITY_PRIVATE)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->visibility)->equals(Project::VISIBILITY_PRIVATE);
        }
    }

    public function testByVisibilityTeamReturnsTeamProjects(): void
    {
        $results = Project::find()
            ->byVisibility(Project::VISIBILITY_TEAM)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->visibility)->equals(Project::VISIBILITY_TEAM);
        }
    }

    // -------------------------------------------------------------------------
    // public / private
    // -------------------------------------------------------------------------

    public function testPublicReturnsOnlyPublicProjects(): void
    {
        $results = Project::find()->public()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->visibility)->equals(Project::VISIBILITY_PUBLIC);
        }
    }

    public function testPrivateReturnsOnlyPrivateProjects(): void
    {
        $results = Project::find()->private()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->visibility)->equals(Project::VISIBILITY_PRIVATE);
        }
    }

    // -------------------------------------------------------------------------
    // byPriority / highPriority
    // -------------------------------------------------------------------------

    public function testByPriorityFiltersCorrectly(): void
    {
        $results = Project::find()
            ->byPriority(Project::PRIORITY_MEDIUM)
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->priority)->equals(Project::PRIORITY_MEDIUM);
        }
    }

    public function testHighPriorityReturnsHighPriorityProjects(): void
    {
        $results = Project::find()->highPriority()->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->priority)->equals(Project::PRIORITY_HIGH);
        }
    }

    // -------------------------------------------------------------------------
    // Chaining
    // -------------------------------------------------------------------------

    public function testChainingByOrganizationIdAndActive(): void
    {
        $results = Project::find()
            ->byOrganizationId('01900000-0000-0001-0000-000000000001')
            ->active()
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->organization_id)->equals('01900000-0000-0001-0000-000000000001');
            verify($project->status)->equals(Project::STATUS_ACTIVE);
        }
    }

    public function testChainingByOwnerAndPublic(): void
    {
        $results = Project::find()
            ->byOwner('01900000-0000-0000-0000-000000000001')
            ->public()
            ->all();

        verify($results)->notEmpty();
        foreach ($results as $project) {
            verify($project->owner_id)->equals('01900000-0000-0000-0000-000000000001');
            verify($project->visibility)->equals(Project::VISIBILITY_PUBLIC);
        }
    }

    // -------------------------------------------------------------------------
    // latest / orderByName
    // -------------------------------------------------------------------------

    public function testLatestOrdersNewestFirst(): void
    {
        $query = Project::find()->latest();
        verify($query)->instanceOf(ProjectQuery::class);

        $results = $query->all();
        verify($results)->notEmpty();
        $last = null;
        foreach ($results as $project) {
            if ($last !== null) {
                verify($project->created_at)->lessThanOrEqual($last);
            }
            $last = $project->created_at;
        }
    }

    public function testOrderByNameOrdersAlphabetically(): void
    {
        $query = Project::find()->orderByName();
        verify($query)->instanceOf(ProjectQuery::class);

        $results = $query->all();
        verify($results)->notEmpty();
        $last = null;
        foreach ($results as $project) {
            if ($last !== null) {
                verify(strcasecmp($project->name, $last))->greaterThanOrEqual(0);
            }
            $last = $project->name;
        }
    }
}
