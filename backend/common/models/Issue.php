<?php

namespace common\models;

use common\models\query\IssueQuery;
use common\models\resource\UserResource;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * This is the model class for table "{{%issue}}".
 * @property string $id
 * @property string $project_id
 * @property string $issue_key
 * @property string $title
 * @property string $description
 * @property int $type
 * @property int $status
 * @property int $priority
 * @property string $created_by
 * @property string|null $assigned_to
 * @property int $created_at
 * @property int|null $updated_at
 * @property int|null $closed_at
 * @property int|null $due_date
 * @property bool $is_archived
 * 
 * @property Project $project
 * @property UserResource $creator
 * @property UserResource|null $assignee
 */
class Issue extends ActiveRecord
{
    const TYPE_BUG = 0;
    const TYPE_FEATURE = 1;
    const TYPE_TASK = 2;
    const TYPE_INCIDENT = 3;
    const TYPES = [
        self::TYPE_BUG,
        self::TYPE_FEATURE,
        self::TYPE_TASK,
        self::TYPE_INCIDENT
    ];

    const STATUS_OPEN = 0;
    const STATUS_IN_PROGRESS = 1;
    const STATUS_REVIEW = 2;
    const STATUS_RESOLVED = 3;
    const STATUS_CLOSED = 4;
    const STATUSES = [
        self::STATUS_OPEN,
        self::STATUS_IN_PROGRESS,
        self::STATUS_REVIEW,
        self::STATUS_RESOLVED,
        self::STATUS_CLOSED
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
            [
                'class' => BlameableBehavior::class,
                'updatedByAttribute' => false
            ]
        ];
    }

    public function beforeValidate()
    {
        if (!parent::beforeValidate()) {
            return false;
        }

        // Ensure that the issue key is generated before validation
        if ($this->isNewRecord && empty($this->issue_key)) {
            $this->issue_key = $this->generateIssueKey();
        }

        if (!$this->isNewRecord) {
            return true;
        }

        $projectId = Yii::$app->request->get('project_id');
        if ($projectId === null) {
            $this->addError('project_id', 'Project ID is required.');
            return false;
        }

        $query = Project::find();

        if (strlen($projectId) === 36) {
            $query->byId($projectId);
        } else {
            $query->byKey($projectId);
        }

        $project = $query->one();

        if (!$project) {
            $this->addError('project_id', 'The specified project does not exist.');
            return false;
        }

        $this->project_id = $project->id;
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
            $this->id = Yii::$app->security->generateRandomString(36);
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
            [['project_id', 'title', 'description'], 'required'],
            [['description'], 'string'],
            [['title'], 'string', 'max' => 255],
            [['issue_key'], 'string', 'max' => 20],
            [['type', 'status', 'priority', 'closed_at', 'due_date', 'created_at', 'updated_at'], 'integer'],
            ['type', 'default', 'value' => self::TYPE_TASK],
            ['status', 'default', 'value' => self::STATUS_OPEN],
            ['priority', 'default', 'value' => self::PRIORITY_MEDIUM],
            ['type', 'in', 'range' => self::TYPES],
            ['status', 'in', 'range' => self::STATUSES],
            ['priority', 'in', 'range' => self::PRIORITIES],
            [['project_id', 'created_by', 'assigned_to'], 'string', 'max' => 36],
            [['is_archived'], 'boolean', 'trueValue' => true, 'falseValue' => false],
            [['project_id', 'created_by', 'assigned_to'], 'string', 'max' => 36],
            [['project_id', 'issue_key'], 'unique', 'targetAttribute' => ['project_id', 'issue_key'], 'message' => 'The combination of Project ID and Issue Key has already been taken.'],
            [['project_id'], 'exist', 'skipOnError' => true, 'targetClass' => Project::class, 'targetAttribute' => ['project_id' => 'id']],
            [['created_by'], 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['created_by' => 'id']],
            [['assigned_to'], 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['assigned_to' => 'id']],
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
            'status',
            'priority',
            'createdBy' => 'created_by',
            'assignedTo' => 'assigned_to',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'closedAt' => 'closed_at',
            'dueDate' => 'due_date',
            'isArchived' => 'is_archived'
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
            'assignee'
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
}
