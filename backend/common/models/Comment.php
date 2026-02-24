<?php

namespace common\models;

use common\models\query\CommentQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * This is the model class for table "{{%comment}}".
 * 
 * @property string $id
 * @property string $issue_id
 * @property string $created_by
 * @property string $updated_by
 * @property integer $created_at
 * @property integer $updated_at
 * @property string $content
 * 
 * @property Issue $issue
 * @property UserResource $creator
 * @property UserResource $updator
 */
class Comment extends ActiveRecord
{
    public static function tableName()
    {
        return '{{%comment}}';
    }

    public function rules()
    {
        return [
            [['issue_id', 'content'], 'required'],
            [['id', 'issue_id', 'created_by', 'updated_by'], 'string', 'max' => 36],
            [['created_at', 'updated_at'], 'integer'],
            [['content'], 'safe'],
        ];
    }

    public function behaviors() {
        return [
            TimestampBehavior::class,
            BlameableBehavior::class
        ];
    }

    public function transactions() {
        return [
            self::SCENARIO_DEFAULT => self::OP_ALL,
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function beforeValidate() {
        if (!parent::beforeValidate()) {
            return false; 
        }

        // if not a new record then no need to create anything
        if (!$this->isNewRecord) {
            return true;
        }

        $projectId = Yii::$app->request->get('project_id');
        if (!$projectId) {
            $this->addError('project_id', 'Project ID is required.');
            return false;
        }

        $issueId = Yii::$app->request->get('issue_id');
        if (!$issueId) {
            $this->addError('issue_id', 'Issue ID is required.');
            return false;
        }


        // check if the issue exists and belongs to the project
        $issueQuery = Issue::find()->byProject($projectId)->byId($issueId);
        $issue = $issueQuery->one();
        if (!$issue) {
            $this->addError('issue_id', 'The specified issue does not exist.');
            return false;
        }

        $this->issue_id = $issueId;
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert) {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if (!$insert) {
            return true;
        }

        if (empty($this->id)) {
            // sortable uid, good for cursor based pagination
            $this->id = (string)Uuid::v7();
        }

        return true;
    }

    public function afterSave($insert, $changedAttributes) {
        parent::afterSave($insert, $changedAttributes);

        if (!$insert) {
            return;
        }

        if ($this->issue->status === Issue::STATUS_CLOSED) {
            $this->issue->openIssue();
            if (!$this->issue->save()) {
                Yii::error('Failed to update issue status after adding comment: ' . json_encode($this->issue->errors));
                throw new yii\db\Exception('Failed to update issue status after adding comment.');
            }
        }
    }

    /**
     * {@inheritdoc} 
     */
    public function fields() {
        return [
            'id',
            'issueId' => 'issue_id',
            'createdBy' => 'created_by',
            'updatedBy' => 'updated_by',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'content'
        ];
    }

    /**
     * {@inheritdoc} 
     */
    public function extraFields() {
        return [
            'issue',
            'creator',
            'updator',
        ];
    }

    public function getIssue()
    {
        return $this->hasOne(Issue::class, ['id' => 'issue_id']);
    }

    public function getCreator() {
        return $this->hasOne(UserResource::class, ['id' => 'created_by']);
    }

    public function getUpdator() {
        return $this->hasOne(UserResource::class, ['id' => 'updated_by']);
    }

    public function canAccess(string $userId): bool {
        if (!$this->issue) {
            return false;
        }

        if (!$this->issue->project) {
            return false;
        }

        return $this->issue->project->canAccess($userId);
    }

    public static function find(): CommentQuery {
        return new CommentQuery(get_called_class());
    }
}