<?php

namespace common\models;

use common\models\query\WorktimeQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * This is the model class for table "{{%worktime}}".
 * 
 * @property string $id
 * @property string $issue_id
 * @property string $created_by
 * @property string|null $updated_by
 * @property int $minutes_spent
 * @property string $description
 * @property string $logged_at
 * @property int $created_at
 * @property int|null $updated_at
 * 
 * @property Issue $issue
 * @property UserResource $creator
 * @property UserResource|null $updator
 */
class Worktime extends ActiveRecord
{
    public static function tableName(): string
    {
        return "{{%worktime}}";
    }

    public function behaviors(): array
    {
        return [
            TimestampBehavior::class,
            BlameableBehavior::class
        ];
    }

    public function rules(): array
    {
        return [
            [['issue_id', 'minutes_spent', 'logged_at'], 'required'],
            ['issue_id', 'string', 'max' => 36],
            ['minutes_spent', 'integer', 'min' => 1],
            ['logged_at', 'date', 'format' => 'php:Y-m-d'],
            ['description', 'string'],
            ['description', 'default', 'value' => ''],
            ['issue_id', 'exist', 'skipOnError' => true, 'targetClass' => Issue::class, 'targetAttribute' => ['issue_id' => 'id']],
        ];
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if (!$this->isNewRecord) {
            return true;
        }

        $this->id = Uuid::v7()->toString();

        return true;
    }

    public function fields(): array
    {
        return [
            'id',
            'issueId' => 'issue_id',
            'minutesSpent' => 'minutes_spent',
            'description',
            'loggedAt' => 'logged_at',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'updatedBy' => 'updated_by',
            'createdBy' => 'created_by'
        ];
    }

    public function extraFields(): array
    {
        return [
            'issue',
            'creator',
            'updator'
        ];
    }

    public function getCreator(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'created_by']);
    }

    public function getIssue(): ActiveQuery
    {
        return $this->hasOne(Issue::class, ['id' => 'issue_id']);
    }

    public function getUpdator(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'updated_by']);
    }

    public static function find(): WorktimeQuery
    {
        return new WorktimeQuery(get_called_class());
    }

}