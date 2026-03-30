<?php

namespace common\components\traits;

use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;

/**
 * Trait for search models that automatically handles eager loading of relations
 * and count subqueries based on the `expand` query parameter.
 *
 * Usage in a search class:
 *
 *   use EagerExpandTrait;
 *
 *   // Optional: define count subqueries for non-relation extra fields
 *   protected function countSubqueries(string $alias): array
 *   {
 *       return [
 *           'issueCount' => "(SELECT COUNT(*) FROM issue i WHERE i.project_id = {$alias}.id)",
 *           'memberCount' => "(SELECT COUNT(*) FROM project_member pm2 WHERE pm2.project_id = {$alias}.id)",
 *       ];
 *   }
 *
 * Then in the search() method:
 *   $this->applyExpand($query, 'p');
 */
trait EagerExpandTrait
{
    /**
     * Override in search classes to provide count subqueries for non-relation extra fields.
     * The table alias used in the main query is passed so subqueries can reference it.
     *
     * @param string $alias The alias of the main table in the query
     * @return array<string, string> Map of field name => SQL subquery
     */
    protected function countSubqueries(string $alias): array
    {
        return [];
    }

    /**
     * Parses the `expand` query param and applies eager loading / count subqueries.
     *
     * - Real AR relations → eager loaded via `->with()`
     * - Count subquery fields → added via `->addSelect()`
     *
     * @param ActiveQuery $query The query to apply expand to
     * @param string $alias The alias of the main table in the query
     */
    protected function applyExpand(ActiveQuery $query, string $alias = ''): void
    {
        $expand = Yii::$app->request->get('expand', '');
        if (empty($expand)) {
            return;
        }

        $requested = array_map('trim', explode(',', $expand));
        $countSubqueries = $this->countSubqueries($alias);

        $withRelations = [];
        foreach ($requested as $field) {
            // Check if it's a count subquery field
            if (isset($countSubqueries[$field])) {
                $query->addSelect([$field => new Expression($countSubqueries[$field])]);
                continue;
            }

            // Check if it's a real AR relation on the parent model
            $relation = $this->getRelation($field, false);
            if ($relation !== null) {
                $withRelations[] = $field;
            }
        }

        if (!empty($withRelations)) {
            $query->with($withRelations);
        }
    }
}
