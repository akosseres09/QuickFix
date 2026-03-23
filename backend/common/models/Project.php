<?php

namespace common\models;

use common\components\behaviors\InvalidateCacheBehavior;
use common\models\query\ProjectQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * Project model
 *
 * @property string $id
 * @property string $organization_id
 * @property string $name
 * @property string $key
 * @property string $description
 * @property string $status
 * @property string $owner_id
 * @property string $visibility
 * @property int $priority
 * @property integer $created_at
 * @property integer $updated_at
 * @property integer | null $archived_at
 * @property bool | null $is_archived
 * 
 * @property UserResource $owner
 * @property Organization $organization
 * @property ProjectMember[] $projectMembers
 * @property User[] $members
 * @property Issue[] $issues
 * @property Label[] $labels
 */
class Project extends ActiveRecord
{
    // Status constants
    const STATUS_ACTIVE = 'active';
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
        self::STATUS_ON_HOLD,
        self::STATUS_COMPLETED
    ];

    public static function getKeyToIdCacheKey(string $organizationId, string $projectKey): string
    {
        return "project_key_to_id_{$organizationId}_{$projectKey}";
    }

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
            ],
            [
                'class' => InvalidateCacheBehavior::class,
                'cacheKeys' => [$this->getKeyToIdCacheKey("$this->organization_id", "$this->key")],
            ]
        ];
    }

    /**
     * 
     * {@inheritDoc}
     */
    public function transactions(): array
    {
        return [
            self::SCENARIO_DEFAULT => self::OP_ALL,
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

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            $this->addError('organization_id', 'Organization ID is required.');
            return false;
        }

        $this->organization_id = $organizationId;
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

        if ($this->is_archived && !$this->getOldAttribute('is_archived')) {
            $this->archived_at = time();
        } else if (!$this->is_archived && $this->getOldAttribute('is_archived')) {
            $this->archived_at = null;
        }

        if (!$insert) {
            return true;
        }

        if ($insert && empty($this->id)) {
            $this->id = Uuid::v7()->toString();
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['name', 'key', 'owner_id'], 'required'],
            [['description'], 'string'],
            [['created_at', 'updated_at', 'archived_at'], 'integer'],
            ['is_archived', 'boolean'],
            ['is_archived', 'default', 'value' => false],
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
            'owner_id' => 'Owner ID',
            'visibility' => 'Visibility',
            'priority' => 'Priority',
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
            'ownerId' => 'owner_id',
            'visibility',
            'priority',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'isArchived' => 'is_archived',
            'archivedAt' => 'archived_at'
        ];
    }

    public function extraFields()
    {
        return ['members', 'owner', 'projectMembers', 'issues', 'labels', 'organization'];
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
     * Gets query for [[Labels]].
     * 
     * @return Yii\db\ActiveQuery
     */
    public function getLabels()
    {
        return $this->hasMany(Label::class, ['project_id' => 'id']);
    }

    /**
     * Gets query for [[Organization]].
     * 
     * @return Yii\db\ActiveQuery
     */
    public function getOrganization()
    {
        return $this->hasOne(Organization::class, ['id' => 'organization_id']);
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

    public function isTeamProject(): bool
    {
        return $this->visibility === self::VISIBILITY_TEAM;
    }

    public function isPrivateProject(): bool
    {
        return $this->visibility === self::VISIBILITY_PRIVATE;
    }

    public function isPublicProject(): bool
    {
        return $this->visibility === self::VISIBILITY_PUBLIC;
    }
}
