<?php

namespace common\models\search;

use common\components\traits\EagerExpandTrait;
use common\models\Project;
use common\models\search\SearchInterface;
use common\models\Worktime;
use Yii;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

/**
 * 
 * @property string $start_date
 * @property string $end_date
 */
class WorktimeSearch extends Worktime implements SearchInterface
{
    use EagerExpandTrait;

    public string $start_date = '';
    public string $end_date = '';

    public function fields(): array
    {
        $fields = parent::fields();

        $newFields = [
            'startDate' => 'start_date',
            'endDate' => 'end_date',
        ];

        return [...$fields, ...$newFields];
    }

    public function rules(): array
    {
        return [
            ['start_date', 'date', 'format' => 'php:Y-m-d'],
            ['end_date', 'date', 'format' => 'php:Y-m-d'],
            [
                'start_date',
                'compare',
                'compareAttribute' => 'end_date',
                'operator' => '<=',
                'type' => 'date',
                'when' => fn($model) => !empty($model->end_date),
                'message' => 'Start Date must be less than or equal to End Date.'
            ],
            [
                'end_date',
                'compare',
                'compareAttribute' => 'start_date',
                'operator' => '>=',
                'type' => 'date',
                'when' => fn($model) => !empty($model->start_date),
                'message' => 'End Date must be greater than or equal to Start Date.'
            ],
        ];
    }


    public function search($params): ActiveDataProvider
    {
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $pageSize = isset($params['pageSize']) ? (int) $params['pageSize'] : 20;
        $pageSize = min($pageSize, 500);

        $organizationId = $params['organization_id'] ?? null;
        if (!$organizationId) {
            throw new BadRequestHttpException('Organization ID is required for worktime search.');
        }

        $projectId = $params['project_id'] ?? null;

        if ($projectId) {
            $exists = Project::find()->byOrganizationId($organizationId)->byId($projectId)->exists();
            if (!$exists) {
                throw new NotFoundHttpException('Project not found for the given project id and organization id.');
            }
            $query = Worktime::find()->byProjectId($projectId);
        } else {
            $query = Worktime::find()
                ->byOrganizationId($organizationId)
                ->byCreatedBy(Yii::$app->user->id);
        }

        $this->applyExpand($query);

        $dataProvider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => $pageSize,
                'page' => $page - 1,
            ],
            'sort' => [
                'defaultOrder' => ['loggedAt' => SORT_DESC],
                'attributes' => [
                    'loggedAt' => [
                        'asc' => ['logged_at' => SORT_ASC],
                        'desc' => ['logged_at' => SORT_DESC],
                    ],
                    'minutesSpent' => [
                        'asc' => ['minutes_spent' => SORT_ASC],
                        'desc' => ['minutes_spent' => SORT_DESC],
                    ]
                ],
            ],
        ]);


        $this->load($params, '');

        if (empty($this->start_date)) {
            $this->start_date = date('Y-m-d', strtotime('-1 week'));
        }

        if (empty($this->end_date)) {
            $this->end_date = date('Y-m-d');
        }

        if (!$this->validate()) {
            return $dataProvider;
        }

        $query->andFilterWhere(['>=', 'logged_at', $this->start_date])
            ->andFilterWhere(['<=', 'logged_at', $this->end_date]);

        return $dataProvider;
    }
}
