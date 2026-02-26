<?php

namespace common\models;

use common\models\query\ProjectMemberQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * ProjectMember model
 *
 * @property string $id
 * @property string $project_id
 * @property string $user_id
 * @property string $role
 * @property integer $created_at
 * 
 * @property Project $project
 * @property User $user
 */
class ProjectMember extends ActiveRecord
{
    // Role constants
    const ROLE_GUEST = 0;
    const ROLE_MEMBER = 1;
    const ROLE_ADMIN = 2;
    const ROLE_OWNER = 3;

    const ROLE_LIST = [
        self::ROLE_GUEST,
        self::ROLE_MEMBER,
        self::ROLE_ADMIN,
        self::ROLE_OWNER
    ];


    /**
     * {@inheritdoc}
     */
    public static function tableName(): string
    {
        return '{{%project_member}}';
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'updatedAtAttribute' => false,
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['project_id', 'user_id'], 'required'],
            [['project_id', 'user_id'], 'string', 'max' => 36],
            [['created_at'], 'integer'],
            [['role'], 'integer'],
            [['role'], 'default', 'value' => self::ROLE_MEMBER],
            [['role'], 'in', 'range' => self::ROLE_LIST],
            [['project_id'], 'exist', 'skipOnError' => true, 'targetClass' => Project::class, 'targetAttribute' => ['project_id' => 'id']],
            [['user_id'], 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['user_id' => 'id']],
            [['project_id', 'user_id'], 'unique', 'targetAttribute' => ['project_id', 'user_id'], 'message' => 'This user is already a member of this project.'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'project_id' => 'Project ID',
            'user_id' => 'User ID',
            'role' => 'Role',
            'created_at' => 'Created At',
        ];
    }

    public function fields()
    {
        return [
            'id',
            'projectId' => 'project_id',
            'userId' => 'user_id',
            'role',
            'createdAt' => 'created_at'
        ];
    }

    public function extraFields()
    {
        return ['project', 'user'];
    }

    /**
     * {@inheritdoc}
     */
    public function beforeValidate()
    {
        if (!parent::beforeValidate()) {
            return false;
        }

        if (!$this->isNewRecord) {
            return true;
        }

        if (!$this->project_id) {
            $this->project_id = Yii::$app->request->get('project_id');
        }

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

        return true;
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
     * Gets query for [[User]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getUser()
    {
        return $this->hasOne(UserResource::class, ['id' => 'user_id']);
    }

    /**
     * {@inheritdoc}
     * @return ProjectMemberQuery the active query used by this AR class.
     */
    public static function find(): ProjectMemberQuery
    {
        return new ProjectMemberQuery(get_called_class());
    }

    /**
     * Get all available roles
     * @return array
     */
    public static function getRoles(): array
    {
        return [
            self::ROLE_GUEST => 'Guest',
            self::ROLE_MEMBER => 'Member',
            self::ROLE_ADMIN => 'Admin',
            self::ROLE_OWNER => 'Owner',
        ];
    }

    /**
     * Check if member is admin
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Check if member is regular member
     * @return bool
     */
    public function isMember(): bool
    {
        return $this->role === self::ROLE_MEMBER;
    }
}
