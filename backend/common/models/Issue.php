<?php

namespace common\models;

use common\models\query\IssueQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;
use yii\web\NotFoundHttpException;

/**
 * This is the model class for table "{{%issue}}".
 * @property string $id
 * @property string $project_id
 * @property string $issue_key
 * @property string $title
 * @property string $description
 * @property int $type
 * @property string $status_label
 * @property int $priority
 * @property string $created_by
 * @property string $updated_by
 * @property string|null $assigned_to
 * @property int $created_at
 * @property int|null $updated_at
 * @property int|null $closed_at
 * @property int|null $due_date
 * @property bool|null $is_archived
 * @property bool $is_draft
 * 
 * @property Project $project
 * @property UserResource $creator
 * @property UserResource|null $assignee
 * @property UserResource $updator
 * @property Label $label
 */
class Issue extends ActiveRecord
{
    const TYPE_TASK = 0;
    const TYPE_FEATURE = 1;
    const TYPE_INCIDENT = 2;
    const TYPE_BUG = 3;
    const TYPES = [
        self::TYPE_BUG,
        self::TYPE_FEATURE,
        self::TYPE_TASK,
        self::TYPE_INCIDENT
    ];

    const PRIORITY_LOW = 0;
    const PRIORITY_MEDIUM = 1;
    const PRIORITY_HIGH = 2;
    const PRIORITY_CRITICAL = 3;
    const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
        self::PRIORITY_CRITICAL
    ];

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return '{{%issue}}';
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors()
    {
        return [
            TimestampBehavior::class,
            BlameableBehavior::class,
        ];
    }

    public function beforeValidate()
    {
        if (!parent::beforeValidate()) {
            return false;
        }

        if (!$this->isNewRecord) {
            return true;
        }

        // Ensure that the issue key is generated before validation
        if (empty($this->issue_key)) {
            $this->issue_key = $this->generateIssueKey();
        }


        $projectId = Yii::$app->request->get('project_id');
        if ($projectId === null) {
            $this->addError('project_id', 'Project ID is required.');
            return false;
        }


        $this->project_id = $projectId;
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert)
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if (!$insert) {
            return true;
        }

        if (empty($this->id)) {
            $this->id = Uuid::v7()->toString();
        }

        if (!empty($this->issue_key)) {
            $this->issue_key = null;
        }

        $this->issue_key = $this->generateIssueKey();
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['project_id', 'title', 'status_label'], 'required'],
            [['description'], 'safe'],
            [['title'], 'string', 'max' => 255],
            [['issue_key'], 'string', 'max' => 20],
            [['type', 'priority', 'closed_at', 'due_date', 'created_at', 'updated_at'], 'integer'],
            ['type', 'default', 'value' => self::TYPE_TASK],
            ['priority', 'default', 'value' => self::PRIORITY_MEDIUM],
            ['type', 'in', 'range' => self::TYPES],
            ['priority', 'in', 'range' => self::PRIORITIES],
            [['project_id', 'created_by', 'assigned_to'], 'string', 'max' => 36],
            [['is_archived', 'is_draft'], 'boolean', 'trueValue' => true, 'falseValue' => false],
            [['is_archived', 'is_draft'], 'default', 'value' => false],
            [['project_id', 'created_by', 'assigned_to'], 'string', 'max' => 36],
            [['project_id', 'issue_key'], 'unique', 'targetAttribute' => ['project_id', 'issue_key'], 'message' => 'The combination of Project ID and Issue Key has already been taken.'],
            [['project_id'], 'exist',  'targetClass' => Project::class, 'targetAttribute' => ['project_id' => 'id']],
            [['created_by'], 'exist',  'targetClass' => UserResource::class, 'targetAttribute' => ['created_by' => 'id']],
            [['assigned_to'], 'exist', 'targetClass' => UserResource::class, 'targetAttribute' => ['assigned_to' => 'id']],
            [['status_label'], 'exist', 'targetClass' => Label::class, 'targetAttribute' => ['status_label' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fields()
    {
        return [
            'id',
            'projectId' => 'project_id',
            'issueKey' => 'issue_key',
            'title',
            'description',
            'type',
            'statusLabel' => 'status_label',
            'priority',
            'createdBy' => 'created_by',
            'assignedTo' => 'assigned_to',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'closedAt' => 'closed_at',
            'dueDate' => 'due_date',
            'isArchived' => 'is_archived',
            'isDraft' => 'is_draft'
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function extraFields()
    {
        return [
            'project',
            'owner',
            'creator',
            'assignee',
            'updator',
            'label'
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

    /**
     * Gets query for [[Creator]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getCreator()
    {
        return $this->hasOne(UserResource::class, ['id' => 'created_by']);
    }

    /**
     * Gets query for [[Assignee]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getAssignee()
    {
        return $this->hasOne(UserResource::class, ['id' => 'assigned_to']);
    }

    /**
     * Gets query for [[Label]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getLabel()
    {
        return $this->hasOne(Label::class, ['id' => 'status_label']);
    }

    /**
     * Gets query for [[Updator]].
     * @return \yii\db\ActiveQuery
     */
    public function getUpdator()
    {
        return $this->hasOne(UserResource::class, ['id' => 'updated_by']);
    }

    public function canAccess(string $userId): bool
    {
        return $this->project && $this->project->canAccess($userId);
    }

    /**
     * {@inheritdoc}
     * @return IssueQuery the active query used by this AR class.
     */
    public static function find(): IssueQuery
    {
        return new IssueQuery(get_called_class());
    }

    /**
     * Generates a unique issue key for the project.
     * Format: <PROJECT_KEY>-<NUMBER>
     * 
     * @return string|null
     */
    public function generateIssueKey()
    {
        // Get the project directly by ID (can't use relation in beforeSave)
        $project = Project::findOne($this->project_id);
        if (!$project) {
            return null;
        }

        $count = Issue::find()->byProjectId($this->project_id)->count();
        $nextNumber = $count + 1;
        return strtoupper($project->key) . '-' . $nextNumber;
    }

    /**
     * Opens an issue
     * @return void
     */
    public function openIssue()
    {
        $openStatusLabel = Yii::$app->cache->getOrSet(Label::getLabelCacheKey('open'), function () {
            return Label::find()->statusOpen()->scalar('id');
        });

        if (!$openStatusLabel) {
            throw new NotFoundHttpException('Open status label not found!');
        }

        $this->status_label = $openStatusLabel;
        $this->closed_at = null;
    }

    /**
     * Closes an issue
     * @return void
     */
    public function closeIssue()
    {
        $closedStatusLabel = Yii::$app->cache->getOrSet(Label::getLabelCacheKey('closed'), function () {
            return Label::find()->statusClosed()->scalar('id');
        });

        if (!$closedStatusLabel) {
            throw new NotFoundHttpException('Closed status label not found!');
        }

        $this->status_label = $closedStatusLabel;
        $this->closed_at = time();
    }
}
