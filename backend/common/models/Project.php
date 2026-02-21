<?php

namespace common\models;

use common\models\query\ProjectQuery;
use common\models\resource\UserResource;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * Project model
 *
 * @property string $id
 * @property string $name
 * @property string $key
 * @property string $description
 * @property string $status
 * @property string $start_date
 * @property string $end_date
 * @property string $owner_id
 * @property string $visibility
 * @property int $priority
 * @property string $color
 * @property integer $progress
 * @property float $budget
 * @property integer $created_at
 * @property integer $updated_at
 * 
 * @property UserResource $owner
 * @property ProjectMember[] $projectMembers
 * @property User[] $members
 * @property Issue[] $issues
 */
class Project extends ActiveRecord
{
    // Status constants
    const STATUS_ACTIVE = 'active';
    const STATUS_ARCHIVED = 'archived';
    const STATUS_ON_HOLD = 'on_hold';
    const STATUS_COMPLETED = 'completed';

    // Visibility constants
    const VISIBILITY_PUBLIC = 'public';
    const VISIBILITY_PRIVATE = 'private';
    const VISIBILITY_TEAM = 'team';

    // Priority constants
    const PRIORITY_LOW = 0;
    const PRIORITY_MEDIUM = 1;
    const PRIORITY_HIGH = 2;
    const PRIORITY_CRITICAL = 3;

    const PRIORITY_LIST = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
        self::PRIORITY_CRITICAL
    ];

    const VISIBILITY_LIST = [
        self::VISIBILITY_PUBLIC,
        self::VISIBILITY_PRIVATE,
        self::VISIBILITY_TEAM
    ];

    const STATUS_LIST = [
        self::STATUS_ACTIVE,
        self::STATUS_ARCHIVED,
        self::STATUS_ON_HOLD,
        self::STATUS_COMPLETED
    ];

    /**
     * {@inheritdoc}
     */
    public static function tableName(): string
    {
        return '{{%project}}';
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        return [
            TimestampBehavior::class,
            [
                'class' => BlameableBehavior::class,
                'createdByAttribute' => 'owner_id',
                'updatedByAttribute' => false,
            ]
        ];
    }

    /**
     * 
     * {@inheritDoc}
     */
    public function transactions(): array {
        return [
            self::SCENARIO_DEFAULT => self::OP_ALL,
        ];
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

        if ($insert && empty($this->id)) {
            $this->id = Yii::$app->security->generateRandomString(36);
        }

        return true;
    }

   /**
    * After saving a new project, we need to create a corresponding ProjectMember record to assign 
    * the owner as a member of the project with the appropriate role. 
    * This ensures that the owner has the necessary permissions to manage the project and its related entities. 
    * If the save operation for the ProjectMember fails, we log the error and throw an exception 
    * to trigger a transaction rollback, maintaining data integrity.
    * 
    * Documentation:
    *
    * {@inheritdoc}
    */
   public function afterSave($insert, $changedAttributes) {
        parent::afterSave($insert, $changedAttributes);

        if (!$insert) {
            return true;
        }

        $owner = new ProjectMember();
        $owner->project_id = $this->id;
        $owner->user_id = $this->owner_id; // Your intentional error might be here
        $owner->role = ProjectMember::ROLE_OWNER;
        
        if (!$owner->save()) {
            $errors = json_encode($owner->getErrors());
            Yii::error("Failed to create project owner. Errors: " . $errors, __METHOD__);
            
            // Throwing an exception here alerts the transaction manager that 
            // something went critically wrong, forcing it to execute a ROLLBACK.
            throw new \yii\db\Exception("Transaction aborted: Could not save Project Member. " . $errors);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['name', 'key', 'owner_id'], 'required'],
            [['description'], 'string'],
            [['start_date', 'end_date'], 'date', 'format' => 'php:Y-m-d'],
            ['start_date', 'compare', 'compareAttribute' => 'end_date', 'operator' => '<=', 'type' => 'date', 'when' => function ($model) {
                return !empty($model->end_date);
            }, 'message' => 'Start Date must be less than or equal to End Date.'],
            ['end_date', 'compare', 'compareAttribute' => 'start_date', 'operator' => '>=', 'type' => 'date', 'when' => function ($model) {
                return !empty($model->start_date);
            }, 'message' => 'End Date must be greater than or equal to Start Date.'],
            [['created_at', 'updated_at'], 'integer'],
            [['budget'], 'number'],
            [['name'], 'string', 'max' => 255],
            [['key'], 'string', 'max' => 10],
            [['key'], 'unique'],
            [['key'], 'match', 'pattern' => '/^[A-Z0-9_-]+$/', 'message' => 'Key must contain only uppercase letters, numbers, - and _ characters'],
            [['status'], 'string', 'max' => 20],
            [['status'], 'default', 'value' => self::STATUS_ACTIVE],
            [['status'], 'in', 'range' => self::STATUS_LIST],
            [['visibility'], 'string', 'max' => 20],
            [['visibility'], 'default', 'value' => self::VISIBILITY_PUBLIC],
            [['visibility'], 'in', 'range' => self::VISIBILITY_LIST],
            [['priority'], 'integer'],
            [['priority'], 'default', 'value' => self::PRIORITY_MEDIUM],
            [['priority'], 'in', 'range' => self::PRIORITY_LIST],
            [['color'], 'string', 'max' => 7],
            [['color'], 'match', 'pattern' => '/^#[0-9A-Fa-f]{6}$/', 'message' => 'Color must be a valid hex color code'],
            [['progress'], 'default', 'value' => 0],
            [['progress'], 'double', 'min' => 0, 'max' => 100],
            [['owner_id'], 'string', 'max' => 36],
            [['owner_id'], 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['owner_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'key' => 'Key',
            'description' => 'Description',
            'status' => 'Status',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
            'owner_id' => 'Owner ID',
            'visibility' => 'Visibility',
            'priority' => 'Priority',
            'color' => 'Color',
            'progress' => 'Progress',
            'budget' => 'Budget',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
        ];
    }

    public function fields()
    {
        return [
            'id',
            'name',
            'key',
            'description',
            'status',
            'startDate' => 'start_date',
            'endDate' => 'end_date',
            'ownerId' => 'owner_id',
            'visibility',
            'priority',
            'color',
            'progress',
            'budget',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
        ];
    }

    public function extraFields()
    {
        return ['members', 'owner', 'projectMembers', 'issues'];
    }

    /**
     * Gets query for [[Owner]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getOwner()
    {
        return $this->hasOne(UserResource::class, ['id' => 'owner_id']);
    }

    /**
     * Gets query for [[ProjectMembers]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProjectMembers()
    {
        return $this->hasMany(ProjectMember::class, ['project_id' => 'id']);
    }

    /**
     * Gets query for [[Members]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getMembers()
    {
        return $this->hasMany(UserResource::class, ['id' => 'user_id'])
            ->viaTable('{{%project_member}}', ['project_id' => 'id']);
    }

    /**
     * Gets query for [[Issues]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getIssues()
    {
        return $this->hasMany(Issue::class, ['project_id' => 'id']);
    }

    /**
     * Check if a user can access this project
     * 
     * @param string $userId
     * @return bool
     */
    public function canAccess(string $userId): bool
    {
        // Owner always has access
        if ($this->owner_id == $userId) {
            return true;
        }

        // Public projects - everyone can access
        if ($this->visibility === self::VISIBILITY_PUBLIC) {
            return true;
        }

        // Private - only owner
        if ($this->visibility === self::VISIBILITY_PRIVATE) {
            return false;
        }

        // Team - check if user is a member
        if ($this->visibility === self::VISIBILITY_TEAM) {
            return ProjectMember::find()
                ->where(['project_id' => $this->id, 'user_id' => $userId])
                ->exists();
        }

        return false;
    }

    /**
     * Check if user is a member of the project
     *
     * @param string $userId
     * @return bool
     */
    public function isMember(string $userId): bool
    {
        return ProjectMember::find()
            ->where(['project_id' => $this->id, 'user_id' => $userId])
            ->exists();
    }

    /**
     * Check if user is an admin member of the project
     *
     * @param string $userId
     * @return bool
     */
    public function isMemberAdmin(string $userId): bool
    {
        return ProjectMember::find()
            ->where([
                'project_id' => $this->id,
                'user_id' => $userId,
                'role' => ProjectMember::ROLE_ADMIN
            ])
            ->exists();
    }

    /**
     * {@inheritdoc}
     * @return ProjectQuery the active query used by this AR class.
     */
    public static function find(): ProjectQuery
    {
        return new ProjectQuery(get_called_class());
    }

    /**
     * Get all available statuses
     * @return array
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_ARCHIVED => 'Archived',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_COMPLETED => 'Completed',
        ];
    }

    /**
     * Get all available visibilities
     * @return array
     */
    public static function getVisibilities(): array
    {
        return [
            self::VISIBILITY_PUBLIC => 'Public',
            self::VISIBILITY_PRIVATE => 'Private',
            self::VISIBILITY_TEAM => 'Team',
        ];
    }

    /**
     * Get all available priorities
     * @return array
     */
    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_CRITICAL => 'Critical',
        ];
    }

    /**
     * Check if project is active
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if project is archived
     * @return bool
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }
}
