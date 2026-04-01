<?php

namespace common\tests\unit\components\traits;

use Codeception\Test\Unit;
use common\components\traits\EagerExpandTrait;
use common\fixtures\OrganizationFixture;
use common\fixtures\ProjectFixture;
use common\models\Project;
use common\tests\UnitTester;
use Yii;
use yii\base\Model;

class EagerExpandTraitTest extends Unit
{
    protected UnitTester $tester;

    public function _fixtures(): array
    {
        return [
            'organization' => [
                'class' => OrganizationFixture::class,
                'dataFile' => codecept_data_dir() . 'organization.php',
            ],
            'project' => [
                'class' => ProjectFixture::class,
                'dataFile' => codecept_data_dir() . 'project.php',
            ],
        ];
    }

    protected function _before()
    {
        parent::_before();
        // Clear any previous query params
        Yii::$app->request->setQueryParams([]);
    }

    public function testCountSubqueries(): void
    {
        $searchModel = $this->createSearchModel();

        // Use reflection to access the protected method
        $reflection = new \ReflectionClass($searchModel);
        $method = $reflection->getMethod('countSubqueries');

        $result = $method->invoke($searchModel, 'p');

        // Should return an array
        $this->assertIsArray($result);

        // Should have the expected keys
        $this->assertArrayHasKey('memberCount', $result);
        $this->assertArrayHasKey('issueCount', $result);

        // Should contain SQL subqueries with the correct alias
        $this->assertStringContainsString('p.id', $result['memberCount']);
        $this->assertStringContainsString('SELECT COUNT(*)', $result['memberCount']);
        $this->assertStringContainsString('project_member', $result['memberCount']);

        $this->assertStringContainsString('p.id', $result['issueCount']);
        $this->assertStringContainsString('SELECT COUNT(*)', $result['issueCount']);
        $this->assertStringContainsString('issue', $result['issueCount']);
    }

    public function testCountSubqueriesWithDifferentAlias(): void
    {
        $searchModel = $this->createSearchModel();

        $reflection = new \ReflectionClass($searchModel);
        $method = $reflection->getMethod('countSubqueries');

        $result = $method->invoke($searchModel, 'proj');

        // The alias should be used in the subqueries
        $this->assertStringContainsString('proj.id', $result['memberCount']);
        $this->assertStringContainsString('proj.id', $result['issueCount']);
    }

    public function testCountSubqueriesReturnsEmpty(): void
    {
        // Create a model without overriding countSubqueries
        $emptyModel = new class extends Model {
            use EagerExpandTrait {
                applyExpand as public;
                countSubqueries as public;
            }

            public function getRelation($name, $throwException = true)
            {
                return null;
            }
        };

        $result = $emptyModel->countSubqueries('p');

        // Default implementation should return empty array
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function testApplyExpandWithoutParameter()
    {
        $searchModel = $this->createSearchModel();
        $query = Project::find();

        $searchModel->applyExpand($query, 'p');

        // Should not add any with() clauses
        $this->assertEmpty($query->with);
    }

    public function testApplyExpandWithEmptyParameter()
    {
        Yii::$app->request->setQueryParams(['expand' => '']);

        $searchModel = $this->createSearchModel();
        $query = Project::find();

        $searchModel->applyExpand($query, 'p');

        $this->assertEmpty($query->with);
    }

    public function testApplyExpandWithValidRelation()
    {
        Yii::$app->request->setQueryParams(['expand' => 'organization']);

        $searchModel = $this->createSearchModel();
        $query = Project::find();

        $searchModel->applyExpand($query, 'p');

        $this->assertNotEmpty($query->with);
        $this->assertContains('organization', $query->with);
    }

    public function testApplyExpandWithMultipleRelations()
    {
        Yii::$app->request->setQueryParams(['expand' => 'organization,members']);

        $searchModel = $this->createSearchModel();
        $query = Project::find();

        $searchModel->applyExpand($query, 'p');

        $this->assertNotEmpty($query->with);
        $this->assertContains('organization', $query->with);
        $this->assertContains('members', $query->with);
    }

    public function testApplyExpandWithCountSubquery()
    {
        Yii::$app->request->setQueryParams(['expand' => 'memberCount']);

        $searchModel = $this->createSearchModel();
        $query = Project::find()->alias('p');

        $searchModel->applyExpand($query, 'p');

        // Check that subquery was added to select
        $this->assertArrayHasKey('memberCount', $query->select);
    }

    public function testApplyExpandWithMixedRelationsAndSubqueries()
    {
        Yii::$app->request->setQueryParams(['expand' => 'organization,memberCount,issueCount']);

        $searchModel = $this->createSearchModel();
        $query = Project::find()->alias('p');

        $searchModel->applyExpand($query, 'p');

        // Should have relation
        $this->assertContains('organization', $query->with);

        // Should have count subqueries
        $this->assertArrayHasKey('memberCount', $query->select);
        $this->assertArrayHasKey('issueCount', $query->select);
    }

    public function testApplyExpandWithInvalidRelation()
    {
        Yii::$app->request->setQueryParams(['expand' => 'nonExistentRelation']);

        $searchModel = $this->createSearchModel();
        $query = Project::find();

        // Should not throw error, just ignore invalid relations
        $searchModel->applyExpand($query, 'p');

        $this->assertEmpty($query->with);
    }

    public function testApplyExpandWithWhitespace()
    {
        Yii::$app->request->setQueryParams(['expand' => ' organization , members ']);

        $searchModel = $this->createSearchModel();
        $query = Project::find();

        $searchModel->applyExpand($query, 'p');

        $this->assertContains('organization', $query->with);
        $this->assertContains('members', $query->with);
    }

    private function createSearchModel()
    {
        return new class(Project::class) extends Model {
            use EagerExpandTrait {
                applyExpand as public;
            }

            private $modelClass;

            public function __construct($modelClass)
            {
                $this->modelClass = $modelClass;
                parent::__construct();
            }

            protected function countSubqueries(string $alias): array
            {
                return [
                    'memberCount' => "(SELECT COUNT(*) FROM project_member pm WHERE pm.project_id = {$alias}.id)",
                    'issueCount' => "(SELECT COUNT(*) FROM issue i WHERE i.project_id = {$alias}.id)",
                ];
            }

            public function getRelation($name, $throwException = true)
            {
                $model = new $this->modelClass();
                return $model->getRelation($name, $throwException);
            }
        };
    }
}
