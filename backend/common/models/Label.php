<?php

namespace common\models;

use common\components\behaviors\InvalidateCacheBehavior;
use common\models\query\LabelQuery;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\db\ActiveRecord;

/**
 * This is the model class for table "{{%label}}".
 * @property string $id
 * @property string $project_id
 * @property string $name
 * @property string $description
 * @property int $index
 * @property string|null $color
 * 
 * @property Project $project
 */
class Label extends ActiveRecord
{
    const STATUS_OPEN = 'Open';
    const STATUS_CLOSED = 'Closed';

    public static function tableName()
    {
        return "{{%label}}";
    }

    public static function getLabelCacheKey(string $labelName, ?string $projectId = null): string
    {
        $base  = "issue_label_{$labelName}";
        if (!$projectId) {
            return $base;
        }

        return "issue_label_{$labelName}_{$projectId}}";
    }

    public function behaviors()
    {
        return [
            [
                'class' => InvalidateCacheBehavior::class,
                'cacheKeys' => [
                    self::getLabelCacheKey('open'),
                    self::getLabelCacheKey('closed')
                ]
            ]
        ];
    }

    public function rules(): array
    {
        return [
            [['name', 'project_id', 'description', 'color'], 'required'],
            ['name', 'string', 'max' => 24],
            ['description', 'string', 'max' => 64],
            ['color', 'string', 'max' => 7],
            ['color', 'match', 'pattern' => '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            [['project_id'], 'exist', 'targetClass' => Project::class, 'targetAttribute' => ['project_id' => 'id']],
            [['project_id', 'name', 'index'], 'unique', 'targetAttribute' => ['project_id', 'name', 'index'], 'message' => 'A label with this name and index already exists in the project.'],
        ];
    }

    public function beforeValidate(): bool
    {
        if (!parent::beforeValidate())
            return false;

        if (!$this->isNewRecord)
            return true;

        $project_id = Yii::$app->request->get('project_id');
        if ($project_id === null) {
            $this->addError('project_id', 'Project ID is required.');
            return false;
        }

        $this->project_id = $project_id;
        return true;
    }

    public function beforeSave($insert)
    {
        if (!parent::beforeSave($insert))
            return false;

        if (!$insert)
            return true;

        if (empty($this->id)) {
            $this->id = Uuid::v7()->toString();
        }

        $index = self::find()->byProjectId($this->project_id)->max('index');
        $this->index = $index !== null ? $index + 1 : 1;

        return true;
    }

    public function fields(): array
    {
        return [
            'id',
            'projectId' => 'project_id',
            'name',
            'color',
            'description'
        ];
    }

    public function extraFields(): array
    {
        return [
            'project',
        ];
    }

    /**
     * Gets query for [[Project]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getProject()
    {
        return $this->hasOne(Project::class, ['id' => 'project_id']);
    }

    public function canAccess(string $userId): bool
    {
        return $this->project?->canAccess($userId) ?? false;
    }

    public static function find(): LabelQuery
    {
        return new LabelQuery(get_called_class());
    }
}
