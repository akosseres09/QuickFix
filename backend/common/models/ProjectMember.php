<?php

namespace common\models;

use api\components\permissions\RoleManager;
use common\models\query\ProjectMemberQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\TimestampBehavior;

/**
 * ProjectMember model
 *
 * @property string $id
 * @property string $project_id
 * @property string $user_id
 * @property string $role
 * @property integer $created_at
 * @property string $created_by
 * @property string|null $updated_by
 * @property integer $updated_at
 *  
 * @property Project $project
 * @property UserResource $user
 * @property UserResource $updator
 * @property UserResource $creator
 */
class ProjectMember extends BaseModel
{
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
    public function rules(): array
    {
        return [
            [['project_id', 'user_id'], 'required'],
            [['project_id', 'user_id'], 'string', 'max' => 36],
            [['created_at'], 'integer'],
            ['role', 'string', 'max' => 16],
            [['role'], 'default', 'value' => RoleManager::ROLE_MEMBER],
            [['role'], 'in', 'range' => RoleManager::ROLE_LIST],
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
            'created_by' => 'Created By',
            'updated_at' => 'Updated At',
            'updated_by' => 'Updated By',
        ];
    }

    public function fields()
    {
        return [
            'id',
            'projectId' => 'project_id',
            'userId' => 'user_id',
            'role',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'updatedBy' => 'updated_by',
            'createdBy' => 'created_by',
        ];
    }

    public function extraFields()
    {
        return ['project', 'user', 'updator', 'creator'];
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
     * Gets query for [[Creator]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getCreator()
    {
        return $this->hasOne(UserResource::class, ['id' => 'created_by']);
    }

    /**
     * Gets query for [[Updator]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getUpdator()
    {
        return $this->hasOne(UserResource::class, ['id' => 'updated_by']);
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
            RoleManager::ROLE_GUEST => 'Guest',
            RoleManager::ROLE_MEMBER => 'Member',
            RoleManager::ROLE_ADMIN => 'Admin',
            RoleManager::ROLE_OWNER => 'Owner',
        ];
    }

    /**
     * Check if member is admin
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === RoleManager::ROLE_ADMIN;
    }

    /**
     * Check if member is regular member
     * @return bool
     */
    public function isMember(): bool
    {
        return $this->role === RoleManager::ROLE_MEMBER;
    }
}
