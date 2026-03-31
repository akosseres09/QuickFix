<?php

namespace common\models;

use api\components\permissions\RoleManager;
use common\models\query\OrganizationMemberQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\db\ActiveQuery;

/**
 * OrganizationMember model
 *
 * @property string $id
 * @property string $organization_id
 * @property string $user_id
 * @property string $role
 * @property string $created_by
 * @property integer $created_at
 * @property string|null $updated_by
 * @property integer|null $updated_at
 *
 * @property Organization $organization
 * @property User $user
 */
class OrganizationMember extends BaseModel
{

    public static function tableName()
    {
        return '{{%organization_member}}';
    }

    public function rules(): array
    {
        return [
            ['user_id', 'required'],
            ['role', 'string', 'max' => 16],
            ['role', 'default', 'value' => RoleManager::ROLE_MEMBER],
            ['role', 'in', 'range' => RoleManager::ROLE_LIST],
            [['organization_id', 'user_id'], 'unique', 'targetAttribute' => ['organization_id', 'user_id'], 'message' => 'This user is already a member of this organization.'],
            ['organization_id', 'exist', 'skipOnError' => true, 'targetClass' => Organization::class, 'targetAttribute' => ['organization_id' => 'id']],
            ['user_id', 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['user_id' => 'id']],
        ];
    }

    public function beforeValidate()
    {
        if (!parent::beforeValidate()) return false;

        if (!$this->isNewRecord) return true;

        if (!empty($this->organization_id)) {
            return true;
        }

        $organizationId = Yii::$app->request->get('organization_id');
        if (!$organizationId) {
            $this->addError('organization_id', 'Organization ID is required!');
            return false;
        }

        $this->organization_id = $organizationId;
        return true;
    }

    public function beforeSave($insert)
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if (!$insert) {
            return true;
        }

        $this->id = Uuid::v7()->toString();

        return true;
    }

    public function fields(): array
    {
        return [
            'id',
            'organizationId' => 'organization_id',
            'userId' => 'user_id',
            'role',
            'createdAt' => 'created_at',
            'createdBy' => 'created_by',
            'updatedAt' => 'updated_at',
            'updatedBy' => 'updated_by',
        ];
    }

    public function extraFields(): array
    {
        return [
            'organization',
            'user',
            'creator',
            'updator',
        ];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'user_id']);
    }

    public function getOrganization(): ActiveQuery
    {
        return $this->hasOne(Organization::class, ['id' => 'organization_id']);
    }

    public function getCreator(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'created_by']);
    }

    public function getUpdator(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'updated_by']);
    }

    public static function find(): OrganizationMemberQuery
    {
        return new OrganizationMemberQuery(get_called_class());
    }
}
