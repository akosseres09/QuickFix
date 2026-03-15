<?php

namespace common\models;

use common\components\behaviors\InvalidateCacheBehavior;
use common\models\query\OrganizationQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * Organization model
 *
 * @property string $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string $owner_id
 * @property string|null $logo_url
 * @property integer $created_at
 * @property integer $updated_at
 * @property integer|null $deleted_at
 *
 * @property UserResource $owner
 * @property OrganizationMember[] $organizationMembers
 * @property Project[] $projects
 */
class Organization extends ActiveRecord
{
    public static function tableName()
    {
        return "{{%organization}}";
    }

    public static function getSlugToIdCache($slug)
    {
        return 'organization_slug_to_id_' . $slug;
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors()
    {
        return [
            [
                "class" => TimestampBehavior::class,
            ],
            [
                "class" => BlameableBehavior::class,
                "createdByAttribute" => "owner_id",
                "updatedByAttribute" => false
            ],
            [
                "class" => InvalidateCacheBehavior::class,
                'cacheKeys' => [$this->getSlugToIdCache($this->id)],
            ]
        ];
    }

    public function rules(): array
    {
        return [
            [['name', 'slug'], 'required'],
            [['name', 'slug'], 'unique'],
            [['name'], 'string', 'max' => 255],
            ['slug', 'string', 'max' => 16],
            ['owner_id', 'exist', 'skipOnError' => true, 'targetClass' => UserResource::class, 'targetAttribute' => ['owner_id' => 'id']],
            ['description', 'string'],
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function beforeSave($insert)
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if (!$insert) {
            return true;
        }

        $this->id = Uuid::v7()->toString();

        if (empty($this->logo_url)) {
            $this->logo_url = $this->generateLogoUrl();
        }

        return true;
    }

    public function afterSave($insert, $changedAttributes)
    {
        parent::afterSave($insert, $changedAttributes);

        if (!$insert) {
            return;
        }

        $owner = new OrganizationMember();
        $owner->organization_id = $this->id;
        $owner->user_id = $this->owner_id;
        $owner->role = OrganizationMember::ROLE_OWNER;

        if (!$owner->save()) {
            $errors = json_encode($owner->getErrors());
            Yii::error("Failed to create organization owner. Errors: " . $errors, __METHOD__);

            throw new \yii\db\Exception("Transaction aborted: Could not save Organization Member. " . $errors);
        }
    }

    public function transactions()
    {
        return [
            self::SCENARIO_DEFAULT => self::OP_ALL,
        ];
    }


    /**
     * {@inheritDoc}
     */
    public function fields()
    {
        return [
            'id',
            'name',
            'slug',
            'description',
            'ownerId' => 'owner_id',
            'logoUrl' => 'logo_url',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'deletedAt' => 'deleted_at',
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function extraFields()
    {
        return [
            'owner',
            'projects',
            'organizationMembers'
        ];
    }

    /**
     * Gets query for [[Projects]].
     * 
     * @return \yii\db\ActiveQuery
     */
    public function getProjects()
    {
        return $this->hasMany(Project::class, ['organization_id' => 'id']);
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
     * Gets query for [[Organization Members]]
     * 
     * @return Yii\db\ActiveQuery
     */
    public function getOrganizationMembers()
    {
        return $this->hasMany(UserResource::class, ['id' => 'user_id'])
            ->viaTable('{{%organization_member}}', ['organization_id' => 'id']);
    }

    public static function find(): OrganizationQuery
    {
        return new OrganizationQuery(get_called_class());
    }

    private function generateLogoUrl()
    {
        return "https://ui-avatars.com/api/?name={$this->name}&background=random&size=256";
    }
}
